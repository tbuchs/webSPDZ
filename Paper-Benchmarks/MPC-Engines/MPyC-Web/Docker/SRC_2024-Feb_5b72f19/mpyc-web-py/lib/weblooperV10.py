import asyncio
import collections
import contextvars
import types
from asyncio import tasks
from random import sample, shuffle
from typing import Any, Callable, Optional

import js
import rich
from lib.api import async_proxy
from lib.stats import MovingAverage, stats
from pyodide.code import run_js
from pyodide.ffi import IN_BROWSER, create_once_callable, create_proxy
from pyodide.webloop import PyodideFuture, PyodideTask, WebLoop


class WebLooper(WebLoop):
    def __init__(self):
        super().__init__()
        stats.reset()
        self.setup_stats()

        self.running = False
        self._ready = collections.deque()
        self._run_once_proxy = create_proxy(self._run_once)
        self.chan = js.MessageChannel.new()
        self.chan.port1.onmessage = self._run_once_proxy

    def setup_stats(self):
        if not stats.enabled:
            return

        # old_register_task = tasks._register_task
        # old_register_eager_task = tasks._register_eager_task
        # # old_add = asyncio.tasks._all_tasks.add

        # def _register_eager_task(self, task) -> None:
        #     stats.state.asyncio.total_tasks_count += 1
        #     stats.state.asyncio.total_eager_tasks_count += 1
        #     old_register_eager_task(task)

        # def _register_scheduled_task(self, task) -> None:
        #     stats.state.asyncio.total_tasks_count += 1
        #     stats.state.asyncio.total_scheduled_tasks_count += 1
        #     old_register_task(task)

        # stats.state.asyncio.total_tasks_count = len(tasks.all_tasks())
        # stats.state.asyncio.total_eager_tasks_count = len(tasks._eager_tasks)
        # stats.state.asyncio.total_scheduled_tasks_count = len(tasks._scheduled_tasks)

        # tasks._register_task = _register_scheduled_task
        # tasks._register_eager_task = _register_eager_task

    # @stats.acc(lambda self, callback, *args, context: stats.time())
    def call_soon(
        self,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ) -> asyncio.Handle:
        delay = 0
        return self.call_later(delay, callback, *args, context=context)

    def call_later(  # type: ignore[override]
        self,
        delay: float,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ) -> asyncio.Handle:
        if delay < 0:
            raise ValueError("Can't schedule in the past")
        h = asyncio.Handle(callback, args, self, context=context)

        def run_handle():
            if h._cancelled:
                return
            try:
                h._run()
            except SystemExit as e:
                if self._system_exit_handler:
                    self._system_exit_handler(e.code)
                else:
                    raise
            except KeyboardInterrupt:
                if self._keyboard_interrupt_handler:
                    self._keyboard_interrupt_handler()
                else:
                    raise

        if delay == 0:
            self._ready.append(run_handle)
            if not self.running:
                self.running = True
                self.trigger_run_once()
                # self._run_once()

            return h
        js.setTimeout(create_once_callable(run_handle), delay * 1000)
        return h

    def trigger_run_once(self):
        self.chan.port2.postMessage(None)

    # @stats.acc(lambda *args, **kwargs: stats.time())
    def _run_once(self, *args, **kwargs):
        stats.state.asyncio.loop_iters += 1
        ntodo = len(self._ready)
        stats.state.asyncio.ntodo = ntodo

        for _ in range(ntodo):
            stats.state.asyncio.loop_inner_iters += 1
            self._ready.popleft()()

        nleft = len(self._ready)
        if nleft == 0:
            self.running = False
        else:
            self.trigger_run_once()

    def create_task(self, coro, *, name=None):
        """Schedule a coroutine object.

        Return a task object.

        Copied from ``BaseEventLoop.create_task``
        """
        self._check_closed()
        if self._task_factory is None:
            task = PyodideTaskStats(coro, loop=self, name=name)
            if task._source_traceback:  # type: ignore[attr-defined]
                # Added comment:
                # this only happens if get_debug() returns True.
                # In that case, remove create_task from _source_traceback.
                del task._source_traceback[-1]  # type: ignore[attr-defined]
        else:
            task = self._task_factory(self, coro)
            tasks._set_task_name(task, name)  # type: ignore[attr-defined]

        self._in_progress += 1
        task.add_done_callback(self._decrement_in_progress)
        return task


class PyodideTaskStats(PyodideTask):
    def __init__(self, coro, *, loop=None, name=None, context=None, eager_start=True):
        super().__init__(coro, loop=loop, name=name, eager_start=eager_start)
        stats.state.asyncio.total_tasks_count += 1

        if eager_start:
            stats.state.asyncio.total_eager_tasks_count += 1
        else:
            stats.state.asyncio.total_scheduled_tasks_count += 1

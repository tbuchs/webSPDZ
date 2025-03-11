import asyncio
import collections
import contextvars
import types
from typing import Any, Callable, Optional

import js
from pyodide.code import run_js
from pyodide.ffi import IN_BROWSER, create_once_callable, create_proxy
from pyodide.webloop import PyodideFuture, PyodideTask, WebLoop

run_js("""    
    self.webChannel = new MessageChannel()
""")

setTimeout = js.setTimeout
chan = js.webChannel


class WebLooper(WebLoop):
    def __init__(self):
        super().__init__()

        loop = self
        old_add = asyncio.tasks._all_tasks.add

        def add(self, task):
            loop.total_tasks_count += 1
            old_add(task)

        asyncio.tasks._all_tasks.add = types.MethodType(add, asyncio.tasks._all_tasks)

        self.loop_iters = 0
        self._ready = collections.deque()
        self._callbacks = {}
        self.counter = 0
        self.total_tasks_count = len(asyncio.tasks._all_tasks)
        self.total_futures_count = 0
        self.call_soon_count = 0
        self.call_later_count = 0
        self.call_callback_count = 0
        self._run_once_proxy = create_proxy(self._run_once)
        # self.call_proxy = create_proxy(self.call_callback)

        # js.setTimeout(self._run_once_proxy, 0)
        chan.port1.onmessage = create_proxy(self.call_callback)

        chan.port2.postMessage(None)

        # self._callbacks[id] = run_handle

        # chan.port1.onmessage =

    def _run_forever(self):
        while True:
            self._run_once()

    def _run_once(self):
        self.loop_iters += 1

        ntodo = len(self._ready)
        for i in range(ntodo):
            self._ready.popleft()()

        if ntodo < 10:
            js.setTimeout(self._run_once_proxy, 0)
        else:
            chan.port2.postMessage(None)

    # @stats.acc(lambda self, callb)
    def call_soon(
        self,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ) -> asyncio.Handle:
        """Arrange for a callback to be called as soon as possible.

        Any positional arguments after the callback will be passed to
        the callback when it is called.

        This schedules the callback on the browser event loop using ``setTimeout(callback, 0)``.
        """
        delay = 0
        return self.call_later(delay, callback, *args, context=context)

    def call_later(  # type: ignore[override]
        self,
        delay: float,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ) -> asyncio.Handle:
        """Arrange for a callback to be called at a given time.

        Return a Handle: an opaque object with a cancel() method that
        can be used to cancel the call.

        The delay can be an int or float, expressed in seconds.  It is
        always relative to the current time.

        Each callback will be called exactly once.  If two callbacks
        are scheduled for exactly the same time, it undefined which
        will be called first.

        Any positional arguments after the callback will be passed to
        the callback when it is called.

        This uses `setTimeout(callback, delay)`
        """
        # print("call_later", delay, callback, args)
        if delay < 0:
            raise ValueError("Can't schedule in the past")
        h = asyncio.Handle(callback, args, self, context=context)

        def run_handle():
            if h.cancelled():
                return
            try:
                # print("running handle", self.counter)
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
            self.call_soon_count += 1

            return h

        # self._ready.append(h)
        self.call_later_count += 1
        # print("call_later", delay, callback, args, f"{self.call_later_count=}")
        setTimeout(create_once_callable(run_handle), delay * 1000)
        return h

    # @stats.acc(lambda self, *args, **kwargs: {"$func": "calls"})
    def call_callback(self, *args, **kwargs):
        # print("call_callback")
        # self._ready.popleft()()
        self._run_once()

    def _decrement_in_progress(self, *args):
        # print("_decrement_in_progress", args)
        self._in_progress -= 1
        if self._no_in_progress_handler and self._in_progress == 0:
            self._no_in_progress_handler()

    def create_future(self) -> asyncio.Future[Any]:
        self._in_progress += 1
        self.total_futures_count += 1
        fut: PyodideFuture[Any] = PyodideFuture(loop=self)
        fut.add_done_callback(self._decrement_in_progress)
        """Create a Future object attached to the loop."""
        return fut

    def create_task(self, coro, *, name=None):
        """Schedule a coroutine object.

        Return a task object.

        Copied from ``BaseEventLoop.create_task``
        """
        self._check_closed()
        if self._task_factory is None:
            task = PyodideTask(coro, loop=self, name=name)
            if task._source_traceback:  # type: ignore[attr-defined]
                # Added comment:
                # this only happens if get_debug() returns True.
                # In that case, remove create_task from _source_traceback.
                del task._source_traceback[-1]  # type: ignore[attr-defined]
        else:
            task = self._task_factory(self, coro)
            asyncio.tasks._set_task_name(task, name)  # type: ignore[attr-defined]

        self._in_progress += 1
        # self.total_tasks_count += 1
        task.add_done_callback(self._decrement_in_progress)
        return task

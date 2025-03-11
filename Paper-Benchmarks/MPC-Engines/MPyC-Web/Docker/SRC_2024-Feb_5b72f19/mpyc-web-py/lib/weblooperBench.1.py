import asyncio
import collections
import contextvars
import types
from functools import partial, partialmethod
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
        old_add = asyncio.tasks._all_tasks.add

        # @stats.time()
        def add(self, task):
            stats_add("total_tasks_count")
            old_add(task)

        # asyncio.tasks._all_tasks.add = types.MethodType(add, asyncio.tasks._all_tasks)
        # stats_set("total_tasks_count", len(asyncio.tasks._all_tasks))

        self.running = False
        self._ready = collections.deque()
        self._run_once_proxy = create_proxy(self._run_once)
        self.chan = js.MessageChannel.new()
        self.chan.port1.onmessage = self.run_once_proxy

    # @stats.time("run_handle_outer2")
    # @stats.time("run_handle_outer1")
    # @stats.time()
    def run_handle(self, h):
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

    # @stats.time()
    def run_once_proxy(self, *args, **kwargs):
        self._run_once_proxy(*args, **kwargs)

    @stats.time("nothing3")
    @stats.time("nothing2")
    @stats.time()
    def nothing(self):
        pass

    def call_soon(
        self,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ) -> asyncio.Handle:
        # self.nothing()

        delay = 0
        return self.call_later(delay, callback, *args, context=context)

    # @stats.time()
    def call_later(  # type: ignore[override]
        self,
        delay: float,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ):
        h, run = self.make_handle(callback, args, context=context)
        # with stats.time():

        if delay < 0:
            raise ValueError("Can't schedule in the past")

        if delay == 0:
            self._ready_append(run)

            if not self.running:
                self.running = True
                self.trigger_run_once()

            return h
        call_handle_later(run, delay)
        return h

    def _ready_append(self, handle):
        self._ready.append(handle)

    def trigger_run_once(self):
        self.chan.port2.postMessage(None)

    # @stats.time()
    def _run_once(self, *args, **kwargs):
        # stats_add("loop_iters")
        ntodo = len(self._ready)
        # stats_set("ntodo", ntodo)

        # with stats.time():
        for _ in range(ntodo):
            # stats_add("loop_inner_iters")
            self._ready.popleft()()

        nleft = len(self._ready)
        # ntodoz(nleft, "left")
        if nleft == 0:
            self.running = False
        else:
            self.trigger_run_once()

    # @stats.time()
    def make_handle(self, callback, args, context=None):
        h = asyncio.Handle(callback, args, self, context=context)
        return h, partial(self.run_handle, h)


def call_handle_later(handle, delay):
    js.setTimeout(create_once_callable(handle), delay * 1000)


def stats_add(path: str, value=1, prefix="asyncio."):
    stats.acc_path(f"{prefix}{path}", value)


def stats_set(path: str, value=1, prefix="asyncio."):
    stats.set_path(f"{prefix}{path}", value)

import asyncio
import collections
import contextvars
import types
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

        def add(self, task):
            stats_add("total_tasks_count")
            old_add(task)

        asyncio.tasks._all_tasks.add = types.MethodType(add, asyncio.tasks._all_tasks)
        stats_set("total_tasks_count", len(asyncio.tasks._all_tasks))

        self.running = False
        self._ready = collections.deque()

    @stats.acc(lambda self, callback, *args, context: stats.time())
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
                stats_add("loop_iters")
                while self._ready:
                    stats_add("loop_inner_iters")
                    stats_set("ntodo", len(self._ready))
                    self._ready.popleft()()
                self.running = False

            return h
        js.setTimeout(create_once_callable(run_handle), delay * 1000)
        return h


def stats_add(path: str, value=1, prefix="asyncio."):
    stats.acc_path(f"{prefix}{path}", value)


def stats_set(path: str, value=1, prefix="asyncio."):
    stats.set_path(f"{prefix}{path}", value)

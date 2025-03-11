import asyncio
import collections
import contextvars
import types
from typing import Any, Callable, Optional

import js
import rich
from lib.api import async_proxy
from lib.stats import stats
from pyodide.code import run_js
from pyodide.ffi import IN_BROWSER, create_once_callable, create_proxy
from pyodide.webloop import PyodideFuture, PyodideTask, WebLoop


class WebLooper(WebLoop):
    def __init__(self):
        super().__init__()
        stats.reset()

        self.running = False
        self._ready = collections.deque()
        self._run_once_proxy = create_proxy(self._run_once)
        self.chan = js.MessageChannel.new()
        self.chan.port1.onmessage = self._run_once_proxy

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

            return h
        js.setTimeout(create_once_callable(run_handle), delay * 1000)
        return h

    def trigger_run_once(self):
        # self._run_once()
        # js.queueMicrotask(self._run_once_proxy)
        self.chan.port2.postMessage(None)
        # js.setTimeout(self._run_once_proxy, 0)
        # js.scheduler.postTask(self._run_once_proxy, {"priority": "user-blocking"})
        # self._run_once_proxy()
        # self.promise.then(self.test_proxy)

    def trigger_run_once_later(self):
        self.chan.port2.postMessage(None)
        # js.setTimeout(self._run_once_proxy, 0)

        # js.scheduler.postTask(self._run_once_proxy, {"priority": "user-blocking"})
        # js.queueMicrotask(self._run_once_proxy)
        # self._run_once_proxy()
        # self.promise.then(self.test_proxy)

    def _run_once(self, *args, **kwargs):
        ntodo = len(self._ready)
        for _ in range(ntodo):
            self._ready.popleft()()
        nleft = len(self._ready)

        if nleft == 0:
            self.running = False
        else:
            self.trigger_run_once_later()

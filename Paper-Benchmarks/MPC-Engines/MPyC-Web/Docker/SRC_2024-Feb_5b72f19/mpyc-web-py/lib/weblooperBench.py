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

        self.running = False
        self._ready = collections.deque()
        # self.set_on_message, self.trigger_run_once = run_js("""
        self.port1, self.trigger_run_once = run_js(
            """
            let chan = new MessageChannel();
            let trigger_run_once = () => chan.port2.postMessage(undefined);
            
            // let set_on_message = (cb) => chan.port1.onmessage = (_) => {cb()}; 
            // [set_on_message, post]
            [chan.port1, trigger_run_once]
        """
        )
        # self.set_on_message(create_proxy(self._run_once))
        self.port1.onmessage = self._run_once

    def call_soon(
        self,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ) -> asyncio.Handle:
        delay = 0
        return self.call_later(delay, callback, *args, context=context)

    @stats.time()
    def call_later(  # type: ignore[override]
        self,
        delay: float,
        callback: Callable[..., Any],
        *args: Any,
        context: contextvars.Context | None = None,
    ):
        h = asyncio.Handle(callback, args, self, context=context)
        # with stats.time():

        if delay < 0:
            raise ValueError("Can't schedule in the past")

        if delay == 0:
            self._ready.append(h)

            if not self.running:
                self.running = True
                self.trigger_run_once()

            return h
        js.setTimeout(create_once_callable(lambda: h._run() if not h._cancelled else None), delay * 1000)
        return h

    def _ready_append(self, handle):
        self._ready.append(handle)

    # @stats.time()
    def _run_once(self, *args, **kwargs):
        ntodo = len(self._ready)

        for _ in range(ntodo):
            h = self._ready.popleft()
            if h._cancelled:
                continue
            h._run()

        if len(self._ready) == 0:
            self.running = False
        else:
            self.trigger_run_once()


def call_handle_later(handle, delay):
    js.setTimeout(create_once_callable(handle), delay * 1000)


def stats_add(path: str, value=1, prefix="asyncio."):
    stats.acc_path(f"{prefix}{path}", value)


def stats_set(path: str, value=1, prefix="asyncio."):
    stats.set_path(f"{prefix}{path}", value)

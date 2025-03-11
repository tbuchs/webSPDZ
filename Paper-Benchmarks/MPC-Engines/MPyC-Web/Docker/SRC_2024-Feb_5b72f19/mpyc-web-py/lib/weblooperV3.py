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
        old_add = asyncio.tasks._all_tasks.add

        def add(self, task):
            stats_add("total_tasks_count")
            old_add(task)

        asyncio.tasks._all_tasks.add = types.MethodType(add, asyncio.tasks._all_tasks)

        self.running = False
        self._ready = collections.deque()
        stats_set("total_tasks_count", len(asyncio.tasks._all_tasks))
        self.promise = js.Promise.resolve()
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

        run_handle.callback = callback
        run_handle.args = args
        run_handle.context = context

        if delay == 0:
            stats_add("call_soon_count")
            self._ready.append(run_handle)
            if not self.running:
                self.running = True
                # js.console.warn("call_later")
                # js.console.warn("call_later")
                # self.promise.then(self.test_proxy)
                # self.promise.then(self.test_proxy)
                # js.console.warn("call_later")
                # self.promise.then(self._run_once_proxy)
                # self.chan
                # self._run_once_proxy()
                # js.queueMicrotask(self._run_once_proxy)
                # while len(self._ready) > 0:
                # print("trigger", len(self._ready))

                self.trigger_run_once()

            return h

        # self._ready.append(h)

        stats_add("call_later_count")
        # print("call_later", delay, callback, args, f"{self.call_later_count=}")
        js.setTimeout(create_once_callable(run_handle), delay * 1000)
        return h

    def trigger_run_once(self):
        stats_add("loop_iters")
        js.queueMicrotask(self._run_once_proxy)
        # self.chan.port2.postMessage(None)
        # js.setTimeout(self._run_once_proxy, 0)
        # js.scheduler.postTask(self._run_once_proxy, {"priority": "user-blocking"})
        # self._run_once_proxy()

    def trigger_run_once_later(self):
        stats_add("loop_reiters")
        self.chan.port2.postMessage(None)
        # js.setTimeout(self._run_once_proxy, 0)

        # js.scheduler.postTask(self._run_once_proxy, {"priority": "user-blocking"})
        # js.queueMicrotask(self._run_once_proxy)
        # self._run_once_proxy()

    # @stats.apply(lambda self, *args, **kwargs: stats.add("loop_iters") | {"ntodo": len(self._ready)})
    def _run_once(self, *args, **kwargs):
        ntodo = len(self._ready)
        # print("ntodo", ntodo)
        stats_set("ntodo", ntodo)
        async_proxy.maybe_send_stats()
        # for i in range(ntodo):
        for i in range(ntodo):
            stats_add("loop_inner_iters")
            # stats_set("ready", len(self._ready))
            # async_proxy.maybe_send_stats()
            # async_proxy.maybe_send_stats()
            # if len(self._ready) < 5:
            #     # stats.stats["handle"] = ""
            #     print("************")
            #     for t in self._ready:
            #         # stats.stats["handle"] += t.stats + "\n"
            #         rich.print(t.callback)
            #         rich.print(t.args)
            #         rich.print(t.context)
            #         rich.print()
            #     # print(stats.stats["handle"])
            #     print("************")

            t = self._ready.popleft()
            # stats.stats["test"] = t
            t()

        ntodo2 = len(self._ready)
        # print("ntodo", ntodo)
        stats_set("ntodo2", ntodo2, prefix="")
        async_proxy.maybe_send_stats()
        # for i in range(ntodo):
        for i in range(ntodo2):
            stats_add("loop_inner_iters2", prefix="")
            t = self._ready.popleft()
            # stats.stats["test"] = t
            t()
        stats_set("ready", len(self._ready))
        if len(self._ready) == 0:
            # print("DONEEE")
            self.running = False
        elif len(self._ready) > 1:
            # print("triggering again")
            # self.trigger_run_once_later()
            # stats.stats["handles"] = f"{len(self._ready)}: "
            # stats.stats["handles"] += f"{self._ready[0].callback}\n"
            self.trigger_run_once()
        else:
            stats.set_path("handles", f"{len(self._ready)}")

            for t in self._ready:
                # rich.inspect(t.callback, all=True)
                stats.acc_path("handles", f"{t.callback} / {t.args}\n")
            self.trigger_run_once_later()
        # if len(self._ready) > 0:
        # self.running = True
        # for i in range(10000):
        #     if len(self._ready) == 0:
        #         self.running = False
        #         break
        #     self.loop_inner_iters += 1
        #     self._ready.popleft()()

        # while len(self._ready) > 0:
        #     self.loop_inner_iters += 1
        #     self._ready.popleft()()

        # self.running = False


def stats_add(path: str, value=1, prefix="asyncio."):
    stats.acc_path(f"{prefix}{path}", value)


def stats_set(path: str, value=1, prefix="asyncio."):
    stats.set_path(f"{prefix}{path}", value)

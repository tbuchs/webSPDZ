import js
from pyodide.code import run_js


from functools import wraps, partial
from typing import (
    Awaitable,
    Iterable,
    Iterator,
    TypeVar,
    Callable,
    ParamSpec,
    Any,
    Coroutine,
    Union,
    TypeGuard,
    overload,
    Concatenate,
)
import asyncio
import time
import gc
import itertools
import logging

P = ParamSpec("P")
R = TypeVar("R")
T = TypeVar("T")

AsyncCallable = Callable[P, Awaitable[R]]
MaybeAsyncCallable = AsyncCallable[P, R] | Callable[P, R]
MaybeAsyncCallable2 = Callable[P, R | Awaitable[R]]
loop = asyncio.get_event_loop()


default_iterations = 1000000
default_repeat = 5
default_timer = time.perf_counter


def to_closure(func: Callable[P, R], *args: P.args, **kwargs: P.kwargs) -> Callable[[], R]:
    return wraps(func)(partial(func, *args, **kwargs))


async def _timeit_async(
    func: AsyncCallable[[], R],
    iterations: int = default_iterations,
    timer: Callable[[], float] = default_timer,
) -> tuple[float, R]:
    it = itertools.repeat(None, iterations - 1)
    gcold = gc.isenabled()
    gc.disable()
    try:
        t1 = timer()
        res = await func()
        for _ in it:
            await func()
        timing = timer() - t1
    finally:
        if gcold:
            gc.enable()
    return timing, res


def _timeit_sync(
    func: Callable[[], R],
    iterations: int = default_iterations,
    timer: Callable[[], float] = default_timer,
) -> tuple[float, R]:
    it = itertools.repeat(None, iterations - 1)
    gcold = gc.isenabled()
    gc.disable()
    try:
        t1 = timer()
        res = func()
        for _ in it:
            func()
        timing = timer() - t1
    finally:
        if gcold:
            gc.enable()
    return timing, res


async def autorange_async(func: AsyncCallable[[], R]) -> tuple[float, R]:
    i = 1
    while True:
        for j in 1, 2, 5:
            iterations = i * j
            time_taken, res = await _timeit_async(func, iterations)
            if time_taken >= 1:
                return (round(iterations / time_taken, 2), res)
        i *= 10


def autorange_sync(func: Callable[[], R]) -> tuple[float, R]:
    i = 1
    while True:
        for j in 1, 2, 5:
            iterations = i * j
            time_taken, res = _timeit_sync(func, iterations)
            if time_taken >= 0.2:
                return (round(iterations / time_taken, 2), res)
        i *= 10


def bench(func: MaybeAsyncCallable[P, R]) -> MaybeAsyncCallable[P, R]:
    def isasynccallable(__obj: MaybeAsyncCallable[P, R]) -> TypeGuard[AsyncCallable[P, R]]:
        return asyncio.iscoroutinefunction(__obj)

    def isnotasynccallable(__obj: MaybeAsyncCallable[P, R]) -> TypeGuard[Callable[P, R]]:
        return not asyncio.iscoroutinefunction(__obj)

    def bench_async2(func: AsyncCallable[P, R]) -> AsyncCallable[P, R]:
        @wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> tuple[float, R | None]:
            maxOpS = 0
            res = None
            for _ in range(3):
                ops, res = await autorange_async(to_closure(func, *args, **kwargs))
                maxOpS = max(maxOpS, ops)

            print_bench(func.__name__, maxOpS, *args, **kwargs)
            return maxOpS, res

        return wrapper  # pyright: ignore

    def bench_sync(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> tuple[float, R | None]:
            maxOpS = 0
            res = None

            for _ in range(3):
                ops, res = autorange_sync(to_closure(func, *args, **kwargs))
                maxOpS = max(maxOpS, ops)

            print_bench(func.__name__, maxOpS, *args, **kwargs)
            return maxOpS, res

        return wrapper  # pyright: ignore

    if isasynccallable(func):
        return bench_async2(func)

    if isnotasynccallable(func):
        return bench_sync(func)

    raise TypeError("Invalid function type")


def print_bench(name: str, t: float, *args, **kwargs):
    if name == "<lambda>":
        name = ""
    args_repr = [repr(arg) for arg in args]
    kwargs_repr = [f"{key}={repr(value)}" for key, value in kwargs.items()]
    args_fmt = ", ".join(args_repr + kwargs_repr)
    logging.info(f"{name}({args_fmt}): {t:,} ops/sec")


# pylint: disable-all
# pylint: disable-all

import rich
from rich.traceback import install

install(show_locals=True)

import logging
from rich.logging import RichHandler

logging.basicConfig(level=logging.DEBUG, handlers=[RichHandler()])


sleep0_v1 = run_js("""
    let makeSleep0 = (cb) => () => new Promise(resolve => cb(resolve));

    var counter = 0;
    var queue = {};
    self.timings = {};
    var channel = new MessageChannel();

    channel.port1.onmessage = function (event) {
        var id = event.data;
        if(id % 5000 == 0) {
            console.warn("calling callback immediately", id)
        }

        var callback = queue[id];
        delete queue[id];
        
        if(id % 500 == 0) {
            self.timings[id].end = performance.now()
        }
        callback();
    };

    const setImmediate = (callback) => {
        queue[++counter] = callback;
        if(counter % 500 == 0) {
            self.timings[counter] = {start: performance.now()}
        }
        channel.port2.postMessage(counter);
    }

    self.sleep0_v1 = makeSleep0(setImmediate)
    console.log(self.sleep0_v1)
    self.setTimeout = setImmediate
    self.setImmediate = setImmediate
    
    sleep0_v1
""")
# await js.sleep0_v1()

from pyodide import webloop

webloop.setTimeout = js.setImmediate
sleep0_v2 = js.sleep0_v1


@bench
async def sleepBench_v1():
    await sleep0_v1()


@bench
async def sleepBench_v2():
    await sleep0_v2()


@bench
def time_sleep_0():
    time.sleep(0)


@bench
async def asyncio_sleep_0():
    await asyncio.sleep(0)


@bench
async def async_nothing():
    pass


@bench
def sync_nothing():
    pass


loop = asyncio.get_event_loop()


@bench
async def bench_create_future():
    loop.create_future()


@bench
async def bench_future_sleep():
    fut = loop.create_future()
    fut.set_result(None)
    await asyncio.ensure_future(fut)


print(js.counter)

# sync_nothing()
# print(js.counter)

# await async_nothing()
# print(js.counter)

await sleepBench_v1()  # pyright: ignore
print(js.counter)
await sleepBench_v2()  # pyright: ignore
print(js.counter)

# time_sleep_0()
# print(js.counter)
# await bench_create_future()
# print(js.counter)
await bench_future_sleep()  # pyright: ignore
print(js.counter)

await asyncio_sleep_0()  # pyright: ignore
print(js.counter)

run_js("""
    console.log("calculating latencies")
    latencies = 0
    let k = 0;
    console.log(Object.values(self.timings).length)
    Object.values(self.timings).forEach(
        ({start, end}) => {
            ++k
            latencies += end - start;
            if(k% 10 == 0) {
                console.log(k, end - start)
                console.log(k, end - start, latencies/k)
            }
        })

    console.log(latencies / k)
""")


# try:
#     await bench(sleep0_v1)()

#     sleep0_v2 = js.sleep0_v1

#     await bench(sleep0_v2)()

# except Exception as e:
#     logging.error(e, exc_info=True)

# rich.inspect(sleep0_v2)
# rich.inspect(sleep0_v1)
# xx = await sleep0_v1
# xx2 = await sleep0_v2


# bench(sleep0_v1)

# # rich.inspect(xx)
# # rich.inspect(xx2)
# # xx()

# # await sleepBench_v1()

# # await sleepBench_v2()

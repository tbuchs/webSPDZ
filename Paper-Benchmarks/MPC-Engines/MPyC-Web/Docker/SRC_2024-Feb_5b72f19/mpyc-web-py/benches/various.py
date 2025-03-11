# pylint: disable-all

import rich
from rich.traceback import install

install(show_locals=True)

import logging
from rich.logging import RichHandler

logging.basicConfig(level=logging.DEBUG, handlers=[RichHandler()])

from functools import wraps, partial
from typing import Awaitable, Iterable, Iterator, TypeVar, Callable, ParamSpec, Any, Coroutine, Union, TypeGuard, overload, Concatenate
import asyncio
import time
import gc
import itertools
import logging

logging.basicConfig(level=logging.DEBUG)

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
    func: AsyncCallable[[], R], iterations: int = default_iterations, timer: Callable[[], float] = default_timer
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
    func: Callable[[], R], iterations: int = default_iterations, timer: Callable[[], float] = default_timer
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
            if time_taken >= 0.5:
                return (round(iterations / time_taken, 2), res)
        i *= 10


def autorange_sync(func: Callable[[], R]) -> tuple[float, R]:
    i = 1
    while True:
        for j in 1, 2, 5:
            iterations = i * j
            time_taken, res = _timeit_sync(func, iterations)
            if time_taken >= 0.5:
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
    args_repr = [repr(arg) for arg in args]
    kwargs_repr = [f"{key}={repr(value)}" for key, value in kwargs.items()]
    args_fmt = ", ".join(args_repr + kwargs_repr)
    logging.info(f"{name}({args_fmt}): {t:,} ops/sec")


async def to_async(func: MaybeAsyncCallable[P, R], *args: P.args, **kwargs: P.kwargs) -> R:
    def isasynccallable(__obj: MaybeAsyncCallable[P, R]) -> TypeGuard[AsyncCallable[P, R]]:
        return asyncio.iscoroutinefunction(__obj)

    def isnotasynccallable(__obj: MaybeAsyncCallable[P, R]) -> TypeGuard[Callable[P, R]]:
        return not asyncio.iscoroutinefunction(__obj)

    if isasynccallable(func):
        return await func(*args, **kwargs)

    if isnotasynccallable(func):
        return await loop.run_in_executor(None, func, *args, **kwargs)

    raise TypeError("Invalid function type")


import asyncio
import time


from typing import (
    Awaitable,
    TypeVar,
    Callable,
    ParamSpec,
    Any,
)


loop = asyncio.get_event_loop()


# For async functions
@bench
async def async_function():
    await asyncio.sleep(1)
    print("Async Function")


# For sync functions
@bench
def sync_function():
    time.sleep(1)
    print("Sync Function")


@bench
async def async_sleep_0123(a: Any, b: Any, c: Any = 4):
    await asyncio.sleep(0.123)


@bench
async def async_nothing():
    pass


@bench
def sync_nothing():
    pass


@bench
async def async_sleep_0():
    await asyncio.sleep(0)


@bench
def sync_sleep_0():
    time.sleep(0)


@bench
async def async_sleep_0001():
    await asyncio.sleep(0.001)


@bench
async def async_sleep_0002():
    await asyncio.sleep(0.002)


@bench
async def async_sleep_0004():
    await asyncio.sleep(0.004)


@bench
def add(a: Any, b: Any, c: Any = 4):
    1 + 1


@bench
def add2(a: Any, b: Any, c: Any = 4):
    a = 1
    b = 2
    c = a + b


@bench
def add3(a: Any, b: Any, c: Any = 4):
    return a + b


@bench
def loopz(a: Any, b: Any, c: Any = 4):
    x = 1
    for i in range(1000):
        x += i
    return x


async def main():
    await async_sleep_0()

    sync_sleep_0()

    await async_nothing()
    sync_nothing()

    await async_sleep_0001()
    await async_sleep_0002()
    await async_sleep_0004()
    x = await async_sleep_0123(3, 4, c=5)  # pyright: ignore

    add(1, 2, 3)
    add2(1, 2, 3)
    add3(1, 2, 3)
    loopz(1, 2, 3)


loop.run_until_complete(main())

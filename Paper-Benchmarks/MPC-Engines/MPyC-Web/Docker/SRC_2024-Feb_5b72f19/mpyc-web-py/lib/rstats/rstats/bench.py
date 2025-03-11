# pylint: disable-all

import asyncio
import gc
import itertools
import logging
import time
from functools import partial, wraps
from typing import Any, Awaitable, Callable, Concatenate, Coroutine, Iterable, Iterator, ParamSpec, TypeGuard, TypeVar, Union, overload

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
            if time_taken >= 0.2:
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

    def bench_async(func: AsyncCallable[P, R]) -> AsyncCallable[P, R]:
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
        return bench_async(func)

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

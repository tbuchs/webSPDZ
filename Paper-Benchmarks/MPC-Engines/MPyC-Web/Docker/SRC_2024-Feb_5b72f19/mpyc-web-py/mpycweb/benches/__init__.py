import asyncio
import time
from typing import Any, Awaitable, Callable, ParamSpec, TypeVar

from lib.bench import bench
from mpycweb import *
from polyscript import xworker

P = ParamSpec("P")
R = TypeVar("R")


AsyncCallable = Callable[P, Awaitable[R]]
MaybeAsyncCallable = AsyncCallable[P, R] | Callable[P, R]
MaybeAsyncCallable2 = Callable[P, R | Awaitable[R]]
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
async def main_async(a: Any, b: Any, c: Any = 4):
    await asyncio.sleep(0.123)


@bench
def main_sync(a: Any, b: Any, c: Any = 4):
    xworker.sync.sleep(0)  # pyright: ignore[reportUnknownMemberType]


@bench
async def main_async2(a: Any, b: Any, c: Any = 4):
    await asyncio.sleep(0.333)


@bench
async def main_async3(a: Any, b: Any, c: Any = 4):
    main_sync(a, b, c=4)


async def main():
    x = await main_async3(3, 4, c=5)  # pyright: ignore

    x = await main_async2(3, 4, c=5)  # pyright: ignore

    x = await main_async(3, 4, c=5)  # pyright: ignore


if __name__ == "__main__":
    asyncio.ensure_future(main())

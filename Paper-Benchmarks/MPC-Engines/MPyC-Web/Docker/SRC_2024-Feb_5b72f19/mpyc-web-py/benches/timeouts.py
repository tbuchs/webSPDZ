# pylint: disable-all


import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, ParamSpec, TypeVar

from rstats import bench

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

    # sync_sleep_0()

    # await async_nothing()
    # sync_nothing()
    logging.info("---done---")


loop.run_until_complete(main())

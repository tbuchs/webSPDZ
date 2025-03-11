# pylint: disable-all


import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, ParamSpec, TypeVar

from rstats import bench

loop = asyncio.get_event_loop()


@bench
def timer():
    return time.time()


@bench
def timer_ns():
    return time.time_ns()


def main():
    timer()
    timer_ns()
    logging.info("---done---")


main()

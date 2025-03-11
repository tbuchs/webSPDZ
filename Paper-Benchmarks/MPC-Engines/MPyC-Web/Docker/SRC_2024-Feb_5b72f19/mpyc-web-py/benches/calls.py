# pylint: disable-all


import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, ParamSpec, TypeVar

from rstats import bench

loop = asyncio.get_event_loop()


def _call_fn():
    pass
    # x = 0
    # for i in range(100):
    #     x *= 17
    # return x


def _call_fn2():
    return _call_fn()


def _call_fn3():
    return _call_fn2()


def _call_fn4():
    return _call_fn3()


def _call_fn5():
    return _call_fn4()


def _call_fn6():
    return _call_fn5()


def _call_fn7():
    return _call_fn6()


def _call_fn8():
    return _call_fn7()


def _call_fn9():
    return _call_fn8()


def _call_fn10():
    return _call_fn9()


@bench
def call_fn10():
    _call_fn10()


@bench
def call_fn():
    _call_fn()


def main():
    call_fn()
    call_fn10()
    logging.info("---done---")


main()

# pylint: disable-all

import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, ParamSpec, TypeVar

from lib.api import async_proxy
from lib.rstats.rstats import BaseStatsCollector, bench

# from rstats import bench, stats
from lib.stats import stats

# stats = BaseStatsCollector()


@bench
def stats_add(path: str, value=1, prefix="asyncio."):
    stats.acc_path(f"{prefix}{path}", value)


@bench
@stats.time()
@stats.acc(lambda path, value=1, prefix="asyncio.": {"test2": 1})
def stats_acc_time(path: str, value=1, prefix="asyncio."):
    pass


@bench
@stats.acc(lambda path, value=1, prefix="asyncio.": {} | {"test2": 1})
def stats_acc(path: str, value=1, prefix="asyncio."):
    pass


@bench
@stats.time()
@stats.acc(lambda path, value=1, prefix="asyncio.": {"test2": 1})
def stats_acc_time_maybe_send(path: str, value=1, prefix="asyncio."):
    async_proxy.maybe_send_stats()


@bench
@stats.time()
@stats.acc(lambda path, value=1, prefix="asyncio.": {"test2": 1})
def stats_acc_time_send(path: str, value=1, prefix="asyncio."):
    async_proxy.send_stats()


@bench
def loop(path: str, value=1, prefix="asyncio."):
    for i in range(1000):
        pass


@bench
@stats.time()
@stats.acc(lambda path, value=1, prefix="asyncio.": {"test2": 1})
def stats_acc_loop(path: str, value=1, prefix="asyncio."):
    for i in range(1000):
        pass


@bench
@stats.time()
@stats.acc(lambda path, value=1, prefix="asyncio.": {"test2": 1})
def stats_acc_time_maybe_send_loop(path: str, value=1, prefix="asyncio."):
    for i in range(1000):
        async_proxy.maybe_send_stats()


@bench
@stats.time()
@stats.acc(lambda path, value=1, prefix="asyncio.": {"test2": 1})
def stats_acc_time_send_loop(path: str, value=1, prefix="asyncio."):
    for i in range(1000):
        async_proxy.send_stats()


@bench
def nothing():
    return


@bench
def nothing2():
    pass


@bench
def merge_maps():
    {"asdf": 1} | {"asdf": 2}


@bench
def merge_maps_assign():
    x = {"asdf": 1} | {"asdf": 2}


@bench
def merge_maps_return():
    return {"asdf": 1} | {"asdf": 2}


@bench
def merge_maps_args(a, b):
    a | b


@bench
def merge_maps_args_assign(a, b):
    x = a | b


@bench
def merge_maps_args_return(a, b):
    return a | b


@bench
def merge_maps_args_assign_return(a, b):
    x = a | b
    return x


@bench
def merge_maps_args_assign_return_big(a, b):
    x = a | b
    return x


def bench_stats(enabled: bool = True):
    # stats.reset()
    stats.enabled = enabled
    logging.info(f"\n--- {stats.enabled=} ---\n")

    stats_acc_time_maybe_send("test")
    stats_acc_time_send("test")
    loop("test")
    stats_acc_loop("test")
    stats_acc_time_maybe_send_loop("test")
    stats_acc_time_send_loop("test")

    stats_add("test")
    stats_acc("test")
    stats_acc_time("test")


def main():
    nothing()
    nothing2()

    bench_stats(False)
    bench_stats(True)

    logging.info("\n --- maps ---")

    merge_maps()
    merge_maps_assign()
    merge_maps_return()
    merge_maps_args({"asdf": 1}, {"asdf": 2})
    merge_maps_args_return({"asdf": 1}, {"asdf": 2})
    merge_maps_args_assign({"asdf": 1}, {"asdf": 2})
    merge_maps_args_assign_return({"asdf": 1}, {"asdf": 2})
    merge_maps_args_assign_return_big({"a": {"b": {"c": {"d": {"e": 1}}}}, "b": 2, "c": 3}, {"z": 1, "y": 2, "x": 3})

    logging.info("--- done ---")


main()

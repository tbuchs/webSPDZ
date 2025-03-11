# pylint: disable-all

import asyncio
import logging
import time
from typing import Any, Awaitable, Callable, ParamSpec, TypeVar

import js
from lib.api import async_proxy
from lib.rstats.rstats import BaseStatsCollector, bench

# from rstats import bench, stats
from lib.stats import stats
from pyodide.code import run_js
from pyodide.ffi import IN_BROWSER, create_once_callable, create_proxy

# stats = BaseStatsCollector()
loop = asyncio.get_event_loop()


def fn(*args, **kwargs):
    return True


def fn2(*args, **kwargs):
    return asyncio.Handle(fn, args, loop)


@bench
def bench_create_once_callable():
    return create_once_callable(fn)


@bench
def bench_promise_once_callable():
    x = js.Promise.resolve(create_once_callable(fn))
    x.then(create_once_callable(fn))


@bench
def bench_call_once_callable():
    create_once_callable(fn)()


@bench
def bench_create_proxy():
    return create_proxy(fn)


proxy = create_proxy(fn)


@bench
def bench_call_proxy():
    proxy()


def main():
    bench_create_once_callable()
    bench_call_once_callable()
    bench_promise_once_callable()
    bench_create_proxy()
    bench_call_proxy()

    logging.info("--- done ---")


# main()

fn2()

fn2_proxy = create_proxy(fn2)

run_js("""
function jsfn(fn) {
    let res = fn();
    return res;
}
""")


@bench
def bench_calljsfn2():
    return js.jsfn(fn2)


@bench
def bench_calljsfn2_proxy():
    return js.jsfn(fn2_proxy)


@bench
def bench_calljsfn2_callable():
    return js.jsfn(create_once_callable(fn2))


bench_calljsfn2()

bench_calljsfn2_proxy()
bench_calljsfn2_callable()

print(js.jsfn(fn2))


print(js.jsfn(fn2_proxy))
print(js.jsfn(create_once_callable(fn2)))

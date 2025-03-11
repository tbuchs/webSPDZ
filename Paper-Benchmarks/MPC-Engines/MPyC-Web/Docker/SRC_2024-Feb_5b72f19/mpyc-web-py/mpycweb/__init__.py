"""
This module provides the main functionality of the mpyc-web package, which allows for secure multi-party computation
in a web environment.
"""

from rich.traceback import install

install(show_locals=True)
import js

js.console.log("mpyc-web-py")
# pylint: disable=wrong-import-position,wrong-import-order

__all__ = [
    "log",
    "set_log_level",
    "ls",
    "NOTSET",
    "DEBUG",
    "INFO",
    "WARNING",
    "ERROR",
    "CRITICAL",
]

import asyncio
import logging
import sys

from lib.weblooper import WebLooper

# from lib.weblooperV2 import WebLooper

asyncio.set_event_loop(WebLooper())

import js
import pyodide
import rich
import rich.pretty
from lib import log
from lib.exception_handler import exception_handler
from lib.log import *
from lib.log_levels import *

log.install(DEBUG)
asyncio.get_event_loop().set_exception_handler(exception_handler)

from lib.stats import stats

log.stats = stats


from lib import api
from pyodide import webloop

stats.enabled = False
log._print_hook = api.async_proxy.maybe_send_stats

api.sync_proxy.load_env()

logger = logging.getLogger(__name__)


import mpyc

logger.debug(f"MPyC version={mpyc.__version__}")  # pyright: ignore[reportGeneralTypeIssues] pylint: disable=no-member,c-extension-no-member


from .patches import *
from .transport import *

# asyncio.ensure_future(api.async_proxy.notify_runtime_ready())

logger.debug(f"Python version={sys.version}")
(a, b, c) = sys._emscripten_info.emscripten_version  # pyright: ignore
logger.debug(f"Emscripten version={a}.{b}.{c}")
logger.debug(f"Pyodide version={pyodide.__version__}")

api.async_proxy.notify_runtime_ready()

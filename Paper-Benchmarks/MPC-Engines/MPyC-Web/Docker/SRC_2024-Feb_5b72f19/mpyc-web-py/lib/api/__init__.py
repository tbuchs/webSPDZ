X = 3

__all__ = [
    "loop",
    "RUNNING_IN_WORKER",
    "run_file",
    "run_code_async",
    "run_code",
    "async_proxy",
    "sync_proxy",
    "stats_printer",
    "AsyncRuntimeProxy",
    "SyncRuntimeProxy",
]

import asyncio
import logging

import pyodide

from .proxy import RUNNING_IN_WORKER, AsyncRuntimeProxy, SyncRuntimeProxy, async_proxy, stats_printer, sync_proxy

loop = asyncio.get_event_loop()
from .run import *

import asyncio
import inspect
import io
import json
import logging
import math
import sys
import time
from collections import deque
from contextlib import ContextDecorator
from datetime import datetime
from enum import StrEnum, auto
from functools import wraps
from typing import Any, Callable, Generic, Mapping, MutableMapping, ParamSpec, TypeAlias, TypeAliasType, TypedDict, TypeVar

import humanize
import rich
import yaml
from humanize import naturalsize, scientific  # type: ignore # pylint: disable=import-error, no-name-in-module
from rich.align import Align
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.tree import Tree

# type: ignore-all
logger = logging.getLogger(__name__)


def metric(value: float, unit: str = "", precision: int = 3) -> str:
    if not math.isfinite(value):
        return humanize._format_not_finite(value)  # type: ignore # pylint: disable=import-error, no-name-in-module, no-member, protected-access
    exponent = int(math.floor(math.log10(abs(value)))) if value != 0 else 0

    if exponent >= 33 or exponent < -30:
        return scientific(value, precision - 1) + unit

    value /= 10 ** (exponent // 3 * 3)
    if exponent >= 3:
        ordinal_ = "kMGTPEZYRQ"[exponent // 3 - 1]
    elif exponent < 0:
        ordinal_ = "mμnpfazyrq"[(-exponent - 1) // 3]
    else:
        ordinal_ = ""
    value_ = format(value, ".%if" % max(0, precision - (exponent % 3) - 1)).rstrip("0").rstrip(".")
    if not (unit or ordinal_) or unit in ("°", "′", "″"):
        space = ""
    else:
        space = " "

    return f"{value_}{space}{ordinal_}{unit}"


def print_to_string(*args, **kwargs):
    output = io.StringIO()
    rich.print(*args, file=output, **kwargs)
    contents = output.getvalue()
    output.close()
    return contents


def rich_to_ansi(renderable) -> str | None:
    """Convert text formatted with rich markup to standard string."""
    console = rich.get_console()

    if console:
        with console.capture() as capture:
            rich.print(renderable)
        return capture.get()


def time_delta_fmt(time_a, time_b):
    return datetime.utcfromtimestamp((time_a - time_b).total_seconds()).strftime("%X")


def format_file_size(size):
    return naturalsize(size, binary=True)


def format_count(count, unit=""):
    return metric(count, unit=unit, precision=3)
    # return humanize.intword(count)

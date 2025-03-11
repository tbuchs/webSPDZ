"""
This module defines logging functionality for the mpyc-web project.

It defines a custom logging handler that uses the rich library to format log messages with emojis and colors.
It also defines a function to set the log level and a custom function to print a directory tree.
"""

__all__ = [
    "set_log_level",
    "ls",
    "NOTSET",
    "TRACE",
    "DEBUG",
    "INFO",
    "WARN",
    "ERROR",
    "fail",
    "afail",
    "aexit",
]

import asyncio
import builtins
import datetime
import gc
import io
import os
import sys
from collections.abc import Iterable
from logging import LogRecord
from pathlib import Path

from rich import pretty
from rich.console import Console
from rich.filesize import decimal
from rich.logging import RichHandler
from rich.markup import escape
from rich.style import Style
from rich.text import Text
from rich.tree import Tree


def fail(message: str = "test exception"):
    raise Exception(message)


async def _afail(delay=0, message: str = "test async exception"):
    await asyncio.sleep(delay)
    raise Exception(message)


def afail(delay=0, message: str = "test async exception"):
    asyncio.ensure_future(_afail(delay, message))


async def _aexit(delay=0, num=1):
    await asyncio.sleep(delay)
    raise Exception(num)


def aexit(delay=0, num=1):
    asyncio.ensure_future(_aexit(delay, num))


from lib.log_levels import *

stats = None
_print_hook = None

console = Console(
    color_system="truecolor",
    force_terminal=True,
    tab_size=4,
    soft_wrap=True,
    safe_box=False,
    legacy_windows=False,
    force_interactive=True,
)


def new_print(*args, **kwargs):
    rich.print(*args, **kwargs)
    # js.console.warn("new_print: _print_hook", *args)
    # js.console.warn(_print_hook)
    # if _print_hook is not None:
    #     _print_hook()


def new_pprint(*args, **kwargs):
    pretty.pprint(*args, **kwargs)
    # js.console.warn("new_pprint: _print_hook", *args)
    # js.console.warn(_print_hook)
    # if _print_hook is not None:
    #     _print_hook()


def install(level, verbosity=0):
    """
    Sets up the logger class for the application.
    """
    rich._console = console  # pylint: disable=protected-access
    builtins.print = new_print

    import pprint

    pprint.pprint = new_pprint
    sys.argv = ["main.py", "--log-level", f"{logging.getLevelName(level)}"]
    logging.setLoggerClass(Logger)
    set_log_level(level, verbosity=verbosity)


def getLogger(name):
    """
    Return a logger with the specified name.

    Args:
        name (str): The name of the logger.

    Returns:
        Logger: The logger object.
    """
    return Logger(name)


class Logger(logging.getLoggerClass()):
    """
    Custom logger class that adds a new log level called 'trace' with varying levels of verbosity.

    Args:
        *args: Variable length argument list.
        **kw: Arbitrary keyword arguments.

    Attributes:
        None

    Methods:
        __init__(*args, **kw): Initializes the Logger class.
        trace(msg, *args, **kw): Logs a message with the 'trace' log level.
    """

    def __init__(self, *args, **kw):
        super().__init__(*args, **kw)

        for i in range(5):
            logging.addLevelName(TRACE - i, f"TRACE-{i}")

    def trace(self, msg, *args, **kw):
        """
        Log a message with severity 'TRACE' on this logger.
        If the logger's effective level is higher than TRACE, this method does nothing.
        """
        lvl = TRACE - (kw["verbosity"] or 0)
        if self.isEnabledFor(lvl):
            self._log(lvl, msg, args, **kw)


def set_log_level(level, verbosity=0):
    """
    Set the log level for the application.

    Args:
        level (int): The log level to set. Must be one of the constants defined in the logging module.
    """
    level = level - verbosity

    opts: dict = {
        "force": True,
        "format": "%(message)s",
        "datefmt": "[%X]",
        "level": level,
        "handlers": [
            Handler(
                markup=True,
                show_time=True,
                rich_tracebacks=True,
                tracebacks_word_wrap=False,
                tracebacks_show_locals=False,
                omit_repeated_times=False,
            )
        ],
    }

    logging.basicConfig(**opts)
    if stats is not None:
        stats.reset()

    # stats.enabled = logging.root.getEffectiveLevel() <= TRACE
    # stats.enabled = logging.root.getEffectiveLevel() <= DEBUG

    if level <= TRACE:
        gc.set_debug(gc.DEBUG_LEAK)
    if level <= TRACE - 1:
        gc.set_debug(gc.DEBUG_STATS | gc.DEBUG_LEAK)
    else:
        gc.set_debug(0)


import rich

infoChar = "🛈"

try:
    import js
    from pyodide.code import run_js

    run_js("""
        function isMobile() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        }
    """)
    infoChar = "ⓘ" if js.isMobile() else "🛈"

except:
    infoChar = "🛈"


class Handler(RichHandler):
    """
    Custom logging handler that extends RichHandler to provide additional functionality.

    Overrides the get_level_emoji and render methods to customize the log output.
    """

    def _get_level_message(self, record: LogRecord, message, traceback):
        # if record.msg:
        #     record.msg = Text(record.msg, style=Style(color="red"))
        if record.stack_info:
            record.stack_info = str(Text(record.stack_info, "red"))
        # if record.exc_info:
        #     record.exc_info = Text(record.exc_info, style=Style(color="red"))

        if record.exc_text:
            record.exc_text = str(Text(record.exc_text, "red"))

        match record.levelname.split("-"):
            case ["CRITICAL", *_]:
                level = Text(" 🔥".ljust(3))
                message.style = "red"
                if traceback:
                    traceback.style = "red"
            case ["ERROR", *_]:
                message.style = "red"
                # level = Text(" ❌".ljust(3))
                level = Text(" ✖".ljust(3), "red")
                if traceback:
                    traceback.style = "red"
            case ["WARNING", *_]:
                # level = Text(" ⚠️ ".ljust(3))
                level = Text(" ⚠".ljust(3))
                message.style = "yellow"
            case ["INFO", *_]:
                # level = Text(" ℹ".ljust(3))
                message.style = Style(color="bright_green")
                level = Text(f" {infoChar}".ljust(3), "bright_green")
            case ["DEBUG", *_]:
                # level = Text("🐞 🪲 ⬤ ℹ️ ⚙️ 🔧 🛠 ⚒ 🛠️ ".ljust(3))
                level = Text(" ⚒".ljust(3), "grey50")
                message.style = "grey50"
            case ["TRACE", *_]:
                level = Text(" ⚒".ljust(3), "purple")
                message.style = "purple"
            case _:
                level = Text(record.levelname.ljust(3))

        return (level, message, traceback)

    def render(self, *, record, traceback, message_renderable):
        # if traceback:
        # rich.inspect("log handler traceback")
        # rich.inspect(traceback)
        # rich.inspect(record)

        path = Path(record.pathname).name
        (level, message, traceback) = self._get_level_message(record, message_renderable, traceback)
        time_format = None if self.formatter is None else self.formatter.datefmt
        log_time = datetime.datetime.fromtimestamp(record.created)
        path = f"{path}:{record.lineno}"
        if record.funcName not in ["<module>", "<lambda>"] and len(record.funcName) < 7:
            path = f"{path}:{record.funcName}"

        if traceback:
            log_time = None
            path = None
            link_path = None
        else:
            # log_time =
            link_path = f"{record.pathname}#{record.lineno}" if self.enable_link_path else None

        log_renderable = self._log_render(
            self.console,
            [message] if not traceback else [traceback],
            log_time=log_time,
            time_format=time_format,
            level=level,
            path=path,
            link_path=link_path,
        )
        return log_renderable


loop = asyncio.get_event_loop()


def print_tree2(path_str=".", prefix="", text=""):
    """
    Print a directory tree.

    Args:
        path (Path): The path to the directory to print.
        prefix (str): The prefix to use for each line of the tree.
        str (str): The string to append to each line of the tree.
    """
    path = Path(path_str)

    for item in path.iterdir():
        print(f"{prefix}├── {item.name}\n")
        if item.is_dir():
            print_tree2(item.name, prefix + "│   ", text)


def ls(directory: str = ".", depth=-1):
    tree = Tree(directory)
    make_tree(directory, tree, depth=depth)
    print(print_to_string(tree))


def make_tree(directory: str | Path, tree: Tree, depth=-1) -> None:
    """Recursively build a Tree with directory contents."""

    if depth == 0:
        return

    # Sort dirs first then by filename
    paths = sorted(
        Path(directory).iterdir(),
        key=lambda path: (path.is_file(), path.name.lower()),
    )
    for path in paths:
        # Remove hidden files
        # if path.name.startswith("."):
        #     continue
        try:
            if path.is_dir():
                style = "dim" if path.name.startswith("__") else ""
                branch = tree.add(
                    f"[bold magenta]:open_file_folder: [link file://{path}]{escape(path.name)}",
                    style=style,
                    guide_style=style,
                )
                make_tree(path, branch, depth=depth - 1)

            else:
                text_filename = Text(path.name, "green")
                text_filename.highlight_regex(r"\..*$", "bold red")
                text_filename.stylize(f"link file://{path}")
                file_size = path.stat().st_size
                text_filename.append(f" ({decimal(file_size)})", "blue")
                icon = "🐍 " if path.suffix == ".py" else "📄 "
                tree.add(Text(icon) + text_filename)
        except Exception as e:
            logging.warning(e)

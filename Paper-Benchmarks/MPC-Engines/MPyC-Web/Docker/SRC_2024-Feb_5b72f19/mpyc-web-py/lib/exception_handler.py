import logging
import sys
import traceback

import rich


def exception_handler(loop, context):
    """Handle some MPyC coroutine related exceptions."""

    logging.error("Exception handler")

    if "handle" in context:
        if "mpc_coro" in context["message"]:
            del context["message"]  # suppress detailed message
            del context["handle"]  # suppress details of handle
            loop.default_exception_handler(context)
            logging.error(
                "",
                exc_info=context["exception"],
                stack_info=True,
            )

            return

    elif "task" in context:
        cb = context["task"]._callbacks[0]
        if isinstance(cb, tuple):
            cb = cb[0]  # NB: drop context parameter
        if "mpc_coro" in cb.__qualname__:
            if not loop.get_debug():  # Unless asyncio debug mode is enabled,
                return  # suppress 'Task was destroyed but it is pending!' message.

    logging.error(
        "",
        exc_info=context["exception"],
        stack_info=True,
    )

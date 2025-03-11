import logging
from typing import Any

import js
import secretsanta
from mpyc.runtime import mpc
from mpycweb.api import async_proxy
from mpycweb.patches import pjs


def onruntimemessage(pid: int, message: Any):
    logging.info(f"{pid=}, {message=}")


async def main():
    await mpc.start()

    async_proxy.on_runtime_message = onruntimemessage

    for party in mpc.parties:
        if party.pid == mpc.pid:
            continue
        for i in range(10):
            logging.debug(f"sending message to {party.pid=}")
            async_proxy.send("proxy:js:mpc:msg:runtime", party.pid, "hello\n")
            # pjs.send_runtime_message(party.pid, "hello")

    # send data to each peer


await main()  # pyright: ignore

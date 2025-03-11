"""
patches.py
"""

__all__ = ["run", "start", "messageExchangerFactory", "shutdown", "pjs"]
import asyncio
import builtins
import datetime
import logging

# pylint: disable=import-error
import time
import types
from asyncio import Future

import js
from lib.exception_handler import exception_handler
from mpyc import asyncoro  # pyright: ignore[reportGeneralTypeIssues] pylint: disable=import-error,disable=no-name-in-module
from mpyc.runtime import Runtime, mpc  # pylint: disable=import-error,disable=no-name-in-module

asyncio.get_event_loop().set_exception_handler(exception_handler)
from lib import api
from polyscript import xworker

from . import proxy

loop = asyncio.get_event_loop()
logger = logging.getLogger(__name__)


def run(self, f):
    """Run the given coroutine or future until it is done."""
    logger.debug(f"monkey patched run() {f.__class__.__name__}")

    if self._loop.is_running():  # pylint: disable=protected-access
        if not asyncio.iscoroutine(f):
            f = asyncoro._wrap_in_coro(f)  # pylint: disable=protected-access
            while True:
                try:
                    f.send(None)
                except StopIteration as exc:
                    return exc.value
        else:
            return asyncio.ensure_future(f)
    # TODO await in JS? https://github.com/pyodide/pyodide/issues/1219
    return self._loop.run_until_complete(f)  # pylint: disable=protected-access


mpc.run = types.MethodType(run, mpc)


pjs = proxy.Client(api.async_proxy, loop)


# TODO refactor runtime.start() to work with multiple transports
# The regular start() starts TCP connections, which don't work in the browser.
# We monkey patch it to use PeerJS instead.
async def start(runtime: Runtime) -> None:
    """Start the MPyC runtime with a PeerJS transport.

    Open connections with other parties, if any.
    """
    global pjs

    loop = runtime._loop  # pylint: disable=protected-access

    pjs = proxy.Client(api.async_proxy, loop)

    logger.debug("monkey patched start()")
    logger.info(f"Start MPyC runtime v{runtime.version} with a PeerJS transport")
    logger.info(f"parties={len(mpc.parties)}, threshold={mpc.options.threshold}, no_async={mpc.options.no_async}")
    runtime.start_time = time.time()

    m = len(runtime.parties)
    if m == 1:
        return

    # m > 1
    for peer in runtime.parties:
        peer.protocol = Future(loop=loop) if peer.pid == runtime.pid else None

    # Listen for all parties < runtime.pid.

    # Connect to all parties > self.pid.
    for peer in runtime.parties:
        if peer.pid == runtime.pid:
            continue

        logger.debug(f"Connecting to {peer}")

        while True:
            try:
                if peer.pid > runtime.pid:
                    factory = messageExchangerFactory(runtime, peer.pid)
                    listener = False
                else:
                    factory = messageExchangerFactory(runtime)
                    listener = True

                logger.debug(f"Creating peerjs connection to {peer.pid} (listener: {listener})...")

                await pjs.create_connection(factory, runtime._loop, peer.pid, listener)  # pylint: disable=protected-access

                logger.debug(f"Creating peerjs connection to {peer.pid} (listener: {listener})... done")
                break
            except asyncio.CancelledError:  # pylint: disable=try-except-raise
                raise

            except Exception as exc:  # pylint: disable=broad-exception-caught
                logger.debug(exc)
            await asyncio.sleep(1)

    logger.info("Waiting for all parties to connect")
    await runtime.parties[runtime.pid].protocol
    logger.info(f"All {m} parties connected.")


def messageExchangerFactory(runtime: Runtime, pid: int | None = None):
    """
    Factory function that returns a MessageExchanger object for the given runtime and process ID.

    Args:
        runtime (Runtime): The runtime object to use for the MessageExchanger.
        pid (int | None): The process ID to use for the MessageExchanger. Defaults to None.

    Returns:
        MessageExchanger: A MessageExchanger object for the given runtime and process ID.
    """

    def _exchanger():
        return asyncoro.MessageExchanger(runtime, pid)

    return _exchanger


mpc.start = types.MethodType(start, mpc)


async def shutdown(self):
    """Shutdown the MPyC runtime.

    Close all connections, if any.
    """
    # Wait for all parties behind a barrier.
    logger.debug("monkey patched shutdown()")
    try:
        while self._pc_level > self._program_counter[1]:  # pylint: disable=protected-access
            await asyncio.sleep(0.1)
        elapsed = time.time() - self.start_time
        logger.info(f"Stop MPyC runtime -- elapsed time: {datetime.timedelta(seconds=elapsed)}")
        m = len(self.parties)
        if m == 1:
            return

        # m > 1
        self.parties[self.pid].protocol = Future(loop=self._loop)  # pylint: disable=protected-access
        logger.info("Synchronize with all parties before shutdown")
        await self.gather(self.transfer(self.pid))

        # Close connections to all parties > self.pid.
        logger.info("Closing connections with other parties")
        # TODO refactor to make this work with closing only the connections to peers with pid > self.pid
        for peer in self.parties:
            if peer.pid == self.pid:
                continue
            logger.debug("Closing connection with peer %d", peer.pid)
            peer.protocol.close_connection()
        await self.parties[self.pid].protocol
    finally:
        pass


# async def shutdown(self):
#     """Shutdown the MPyC runtime.

#     Close all connections, if any.
#     """
#     # Wait for all parties behind a barrier.
#     while self._pc_level > self._program_counter[1]:
#         await asyncio.sleep(0)
#     elapsed = time.time() - self.start_time
#     elapsed = str(datetime.timedelta(seconds=elapsed))  # format: YYYY-MM-DDTHH:MM:SS[.ffffff]
#     elapsed = elapsed[:-3] if elapsed[-7] == '.' else elapsed + '.000'  # keep milliseconds .fff
#     nbytes = [peer.protocol.nbytes_sent if peer.pid != self.pid else 0 for peer in self.parties]
#     logging.info(f'Stop MPyC -- elapsed time: {elapsed}|bytes sent: {sum(nbytes)}')
#     logging.debug(f'Bytes sent per party: {" ".join(map(str, nbytes))}')
#     m = len(self.parties)
#     if m == 1:
#         return

#     # m > 1
#     self.parties[self.pid].protocol = Future(loop=self._loop)
#     logging.debug('Synchronize with all parties before shutdown')
#     await self.gather(self.transfer(self.pid))

#     # Close connections to all parties > self.pid.
#     logging.debug('Closing connections with other parties')
#     for peer in self.parties[self.pid + 1:]:
#         peer.protocol.close_connection()
#     await self.parties[self.pid].protocol

old_open = builtins.open

import os

import rich


def open_fetch(*args, **kwargs):
    """
    A function that wraps around the built-in open() function and fetches the file content from a remote server if the file is not found locally.

    Args:
        *args: Variable length argument list.
        **kwargs: Arbitrary keyword arguments.

    Returns:
        The content of the file as a BytesIO object.

    Raises:
        FileNotFoundError: If the file is not found locally or remotely.
    """
    try:
        return old_open(*args, **kwargs)
    except FileNotFoundError as e:
        data = xworker.sync.fetch(e.filename).to_py()
        os.makedirs(os.path.dirname(e.filename), exist_ok=True)
        with old_open(e.filename, "wb+") as f:
            f.write(data)

        return old_open(*args, **kwargs)


def try_fetch(path):
    try:
        data = xworker.sync.fetch(path).to_py()
        # exit(0)
        # data = open_url(e.filename) # TODO use atomics.wait and notify
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with old_open(path, "wb+") as f:
            f.write(data)

        return
    except:
        pass


# old_open = builtins.open
old_open = open
# old_open = os.open
old_stat = os.stat
patched = True


# def _open(path, depth=0, **kwargs):
#     global patched
#     try:
#         if depth > 0:
#             return old_open(path, os.O_CREAT, **kwargs)

#         res = _open(path, depth=depth + 1, **kwargs)

#         if res:
#             return res
#     except FileNotFoundError as e:
#         try_fetch(e.filename)
#         return _open(path, depth=depth + 1, **kwargs)
#     finally:
#         patched = True


# def _stat(*args, **kwargs):
#     global patched
#     try:
#         if not patched:
#             return old_stat(*args, **kwargs)

#         patched = False
#         res = _stat(*args, **kwargs)
#         if res:
#             return res
#     except FileNotFoundError as e:
#         try_fetch(e.filename)
#         return _stat(*args, **kwargs)
#     finally:
#         patched = True


# builtins.open = _open
# os.stat = _stat
builtins.open = open_fetch

mpc.shutdown = types.MethodType(shutdown, mpc)

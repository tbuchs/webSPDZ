"""
This module provides a client for establishing connections with other peers using the PeerJS protocol.
"""

import asyncio
import logging
from typing import Any, Awaitable, Callable

import js
import rich
import rich.text
from lib import api
from lib.stats import stats
from mpyc import asyncoro  # pyright: ignore[reportGeneralTypeIssues] pylint: disable=import-error,disable=no-name-in-module
from pyodide.ffi import JsProxy, to_js

from .run_mpc import run_mpc
from .transport import AbstractClient, PeerJSTransport

logger = logging.getLogger(__name__)
loop = asyncio.get_event_loop()


class Client(AbstractClient):
    """
    A client for establishing connections with other peers using the PeerJS protocol.

    Args:
        worker (Any): The worker object for sending and receiving messages.
        loop (AbstractEventLoop): The event loop for scheduling tasks.

    Attributes:
        worker (Any): The worker object for sending and receiving messages.
        loop (AbstractEventLoop): The event loop for scheduling tasks.
        transports (Dict[int, PeerJSTransport]): A dictionary of active transports, indexed by peer ID.

    Methods:
        create_connection(protocol_factory, loop, pid, listener): Creates a new connection with a peer.
        send_ready_message(pid, message): Sends a ready message to a peer.
        on_ready_message(pid, message): Receives a ready message from a peer.
        send_runtime_message(pid, message): Sends a runtime message to a peer.
        on_runtime_message(pid, message): Receives a runtime message from a peer.
    """

    def __init__(self, async_proxy: api.AsyncRuntimeProxy, _loop: asyncio.AbstractEventLoop):
        self._loop = _loop

        self.transports = {}
        self.async_proxy = async_proxy

        async_proxy.on_ready_message = self.on_ready_message
        async_proxy.on_runtime_message = self.on_runtime_message
        async_proxy.on_run_mpc = run_mpc
        # xworker.onmessage = onmessage(self.on_ready_message, self.on_runtime_message)

    async def create_connection(
        self,
        protocol_factory: Callable[[], asyncoro.MessageExchanger],
        loop: asyncio.AbstractEventLoop,
        pid: int,
        listener: bool,
    ) -> tuple[asyncio.Transport, asyncio.Protocol]:
        """
        Creates a new connection with the given protocol factory and event loop.

        Args:
            protocol_factory (Callable[[], asyncoro.MessageExchanger]): A callable that returns a new instance of a protocol.
            loop (AbstractEventLoop): The event loop to use for the connection.
            pid (int): The ID of the peer to connect to.
            listener (bool): Whether or not this peer is a listener.

        Returns:
            tuple[Transport, Protocol]: A tuple containing the transport and protocol objects for the new connection.
        """
        p = protocol_factory()
        t = PeerJSTransport(loop, pid, self, p, listener)
        self.transports[pid] = t
        return t, p

    def send_ready_message(self, pid: int, message: str):
        self.async_proxy.send("proxy:js:mpc:msg:ready", pid, message)

    def on_ready_message(self, pid: int, message: str):
        """
        Handle a 'ready' message from a peer.

        Args:
            pid (int): The ID of the peer sending the message.
            message (str): The message content.

        Returns:
            None
        """
        if pid not in self.transports:
            logger.warning(f"Received ready message from {pid} but no transport exists for that pid yet")
            return
        self.transports[pid].on_ready_message(message)

    @stats.time()
    def send_runtime_message(self, pid: int, message: bytes):
        stats.sent_to(pid, message)

        self.async_proxy.send("proxy:js:mpc:msg:runtime", pid, message)

    @stats.time()
    def on_runtime_message(self, pid: int, message: bytes, ts: float) -> None:
        """
        Handle a runtime message from a peer.

        Args:
            pid (int): The ID of the peer sending the message.
            message (JsProxy): The message received from the peer.
        """
        stats.latency(ts)
        stats.received_from(pid, message)
        self.transports[pid].on_runtime_message(message)

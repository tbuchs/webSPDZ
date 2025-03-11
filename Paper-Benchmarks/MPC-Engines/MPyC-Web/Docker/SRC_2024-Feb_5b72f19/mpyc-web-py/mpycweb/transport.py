"""
    transport.py - Transport class for mpyc-web
"""

import asyncio
import logging

from mpyc import asyncoro  # pyright: ignore[reportGeneralTypeIssues] pylint: disable=import-error,disable=no-name-in-module

logger = logging.getLogger(__name__)


class AbstractClient:
    """
    An abstract class representing a client that can send messages to a runtime and signal when it's ready.

    Attributes:
        None

    Methods:
        send_runtime_message(pid: int, message: bytes) -> None:
            Sends a message to the runtime with the given process ID.

        send_ready_message(pid: int, message: str) -> None:
            Signals that the client is ready to communicate with the runtime with the given process ID.
    """

    def send_runtime_message(self, pid: int, message: bytes):
        """
        Sends a message to the runtime with the given process ID.

        Args:
            pid (int): The process ID of the runtime to send the message to.
            message (bytes): The message to send to the runtime.
        """
        raise NotImplementedError

    def send_ready_message(self, pid: int, message: str):
        """
        Sends a ready message to the specified process ID with the given message.

        Args:
            pid (int): The process ID to send the message to.
            message (str): The message to send.

        Raises:
            NotImplementedError: This method is not implemented and should be overridden in a subclass.
        """
        raise NotImplementedError


class PeerJSTransport(asyncio.Transport):  # pylint: disable=abstract-method
    """
    A transport class for communicating with peers over a network connection.

    Args:
        _loop (asyncio.AbstractEventLoop): The event loop to use for asynchronous operations.
        pid (int): The ID of the peer.
        client (AbstractClient): The client object used for sending messages to peers.
        protocol (asyncoro.MessageExchanger): The message exchanger protocol to use for communication.
        listener (bool): Whether this transport is a listener or not.

    Attributes:
        _loop (asyncio.AbstractEventLoop): The event loop to use for asynchronous operations.
        _protocol (asyncoro.MessageExchanger): The message exchanger protocol to use for communication.
        _listener (bool): Whether this transport is a listener or not.
        _closing (bool): Whether the transport is closing or not.
        pid (int): The ID of the peer.
        client (AbstractClient): The client object used for sending messages to peers.
        ready_for_next_run (bool): Whether the transport is ready for the next run or not.
        peer_ready_to_start (bool): Whether the peer is ready to start or not.
    """

    def __init__(
        self,
        _loop: asyncio.AbstractEventLoop,
        pid: int,
        client: AbstractClient,
        protocol: asyncoro.MessageExchanger,
        listener: bool,
    ):
        super().__init__()
        self._loop = _loop
        self._protocol = protocol
        self._listener = listener
        self._closing = False
        self.pid = pid
        self.client = client

        self.ready_for_next_run = True
        self.peer_ready_to_start = False

        # need to coordinate the start of running the demo with all peers
        # send "are you ready?" messages every second and call connection_made when all peers are ready
        if not self._listener:
            self._loop.create_task(self._connect_to_peer())

    async def _connect_to_peer(self):
        while not self.peer_ready_to_start:
            ## send ready messages to this connection's peer to check if the user has clicked "run mpyc demo"
            # self._loop.call_soon(self.client.send_ready_message, self.pid, "ready?")
            self.client.send_ready_message(self.pid, "ready?")
            await asyncio.sleep(1)

    def write(self, data: bytes):
        """Write some data bytes to the transport.

        This does not block; it buffers the data and arranges for it
        to be sent out asynchronously.
        """

        # self._loop.call_soon(self.client.send_runtime_message, self.pid, data)  # TODO buffer?
        self.client.send_runtime_message(self.pid, data)  # TODO buffer?

    def on_runtime_message(self, message: bytes):
        """
        Callback method that is called when a runtime message is received.

        Args:
            message (bytes): The message received from the runtime.
        """
        # self._loop.call_soon(self._protocol.data_received, message)
        self._protocol.data_received(message)

    def on_ready_message(self, message: str):
        """
        Handle a 'ready' message from a peer.

        Args:
            message (str): The message received from the peer.

        Returns:
            None
        """
        logger.debug(f"receiving on_ready_message {message}")
        match message:
            case "ready?":
                logger.debug(f"party {self.pid} asks if we are ready to start")
                if self.ready_for_next_run:
                    self._protocol.connection_made(self)
                    # self._loop.call_soon(self.client.send_ready_message, self.pid, "ready_ack")
                    self.client.send_ready_message(self.pid, "ready_ack")
                    self.ready_for_next_run = False

            case "ready_ack":
                logger.debug(f"party {self.pid} confirmed ready to start")
                # self._loop.call_soon(self._protocol.connection_made, self)
                self._protocol.connection_made(self)

                self.peer_ready_to_start = True

    def is_closing(self):
        return self._closing

    def close(self):
        logger.debug("closing connection")
        self._closing = True
        self._protocol.connection_lost(None)

    def set_protocol(self, protocol: asyncoro.MessageExchanger):
        self._protocol = protocol

    def get_protocol(self):
        return self._protocol

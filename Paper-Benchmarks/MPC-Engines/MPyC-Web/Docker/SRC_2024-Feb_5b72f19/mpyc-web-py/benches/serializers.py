# pylint: disable-all
# pylint: disable-all

import rich
from rich.traceback import install

install(show_locals=True)

import logging
from rich.logging import RichHandler

logging.basicConfig(level=logging.DEBUG, handlers=[RichHandler()])


from msgpack import fallback
from cbor2 import loads, dumps

# import _cbor2


def add_byte(data):
    if type(data) == type(b"1"):
        return data + b"120"
    return data + [b"120"]


def remove_byte(data):
    return data[:-1]


def labeled_list_encoder(data):
    return [data, "fairly_long_label________________"]


def labeled_list_decoder(data):
    return data[:-1]


def byte_label_list_encoder(data):
    return [data, b"120"]


def byte_label_list_decoder(data):
    return data[:-1]


def labeled_list_destructure_encoder(data):
    return ["fairly_long_label________________", data]


def labeled_list_destructure_decoder(data):
    [label, *rest] = data
    return rest


packers = [
    ("byte_labeled_list", byte_label_list_encoder, byte_label_list_decoder),
    ("labeled_list", labeled_list_encoder, labeled_list_decoder),
    (
        "labeled_list_destructure",
        labeled_list_destructure_encoder,
        labeled_list_destructure_decoder,
    ),
    ("add_byte", add_byte, remove_byte),
    ("cbor2", dumps, loads),
    # ("_cbor2", _cbor2.dumps, _cbor2.loads),
    ("msgpack fallback", fallback.Packer().pack, fallback.unpackb),
]

try:
    from msgpack import _cmsgpack

    packers = [("msgpack main", _cmsgpack.Packer().pack, _cmsgpack.unpackb)] + packers

except Exception as e:
    # logging.error(e, exc_info=True, stack_info=True)
    pass


def simple(name, data):
    for description, _pack, _unpack in packers:
        msg = f"{description} packer: {name}[{len(data)}]"
        _, packed_data = bench(lambda name: _pack(data))(msg)

        msg = f"{description} unpacker: {name}[{len(packed_data)}]"
        _, res = bench(lambda name: _unpack(packed_data))(msg)

        logging.info(f"len(res) = {len(res)}")


def main():
    simple("integers", [7] * 10000)
    simple("bytes", [b"x" * n for n in range(100)] * 10)
    simple("lists", [[]] * 10000)
    simple("dicts", [{}] * 10000)


main()

from typing import Any, TypedDict, TypeVar

Numeric = int | float

_K = TypeVar("_K")
_V = TypeVar("_V")

NestedDict = dict[_K, _V | "NestedDict[_K, _V]"]

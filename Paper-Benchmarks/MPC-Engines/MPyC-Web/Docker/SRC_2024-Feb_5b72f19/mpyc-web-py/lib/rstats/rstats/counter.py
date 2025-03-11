from typing import Any, TypeVar

from .types import NestedDict, Numeric

K = TypeVar("K")


class DeepCounter(NestedDict[K, Numeric | Any]):
    """A nested dictionary that stores numeric values and supports recursive updates.

    This class extends the `NestedDict` class and adds two methods for updating its values:
    `set` and `update`. Both methods take a nested dictionary as input and update the values
    in the `DeepCounter` instance recursively, i.e., for each key in the input dictionary,
    the corresponding value is either added to the current value (for `update`) or replaced
    by the input value (for `set`).

    The `DeepCounter` class is parameterized by two type variables: `K` and `Numeric`.
    `K` represents the type of the keys in the nested dictionary, while `Numeric` represents
    the type of the numeric values that can be stored in the dictionary.

    Example usage:
    ```
    >>> counter = DeepCounter[int, float]()
    >>> counter.set({1: {2: 3.0}})
    >>> counter.update({1: {2: 1.5}})
    >>> counter
    {1: {2: 4.5}}
    ```
    """

    # def __init__(self, state: NestedDict[K, Numeric | Any] = {}) -> None:
    # self.state = state
    def get_path(self, *path: K, default=None) -> Numeric | Any:
        d = self
        for key in path[:-1]:
            d = d.setdefault(key, {})
            if not isinstance(d, dict):
                raise TypeError(f"Invalid value of type {type(d)} for key {key}")

        if path[-1] in d:
            return d[path[-1]]
        else:
            d[path[-1]] = default
            return default

    def set_path(self, value: Numeric, *path: K):
        d = self
        for key in path[:-1]:
            d = d.setdefault(key, {})
            if not isinstance(d, dict):
                raise TypeError(f"Cannot set {type(value)} to {type(d)} for key {key}")

        d[path[-1]] = value

    def acc_path(self, value: Numeric, *path: K):
        # d = self.state
        d = self
        for key in path[:-1]:
            # Create a nested dictionary if key does not exist
            d = d.setdefault(key, {})
            if not isinstance(d, dict):
                raise TypeError(f"Cannot set {type(value)} to {type(d)} for key {key}")
        last_key = path[-1]
        d.setdefault(last_key, 0)
        old_val = d[last_key]

        if not isinstance(old_val, Numeric):
            raise TypeError(f"Cannot add {type(value)} and {type(old_val)} for key {last_key}")

        d[last_key] = old_val + value

    def set(self, iterable: NestedDict[K, Numeric]):
        """
        Recursively sets the values of the nested dictionary to the values of the given iterable.

        Args:
            iterable (NestedDict[K, Numeric]): A nested dictionary containing the values to set.
        """
        self._set_recursive(self, iterable)

    def _set_recursive(self, target: NestedDict[K, Numeric], source: NestedDict[K, Numeric]):
        for key, value in source.items():
            if key in target:
                target_val = target[key]
                if isinstance(target_val, dict) and isinstance(value, dict):
                    self._set_recursive(target_val, value)
                elif isinstance(target_val, Numeric) and isinstance(value, Numeric):
                    target[key] = value
                else:
                    raise TypeError(f"Cannot set {type(value)} to {type(target[key])} for key {key}")
            else:
                target[key] = value

    def update(self, iterable: NestedDict[K, Numeric]):
        self._update_recursive(self, iterable)

    def _update_recursive(self, target: NestedDict[K, Numeric], source: NestedDict[K, Numeric]):
        for key, value in source.items():
            if key in target:
                target_val = target[key]
                if isinstance(target_val, dict) and isinstance(value, dict):
                    self._update_recursive(target_val, value)
                elif isinstance(target_val, Numeric) and isinstance(value, Numeric):
                    target[key] = target_val + value
                else:
                    raise TypeError(f"Cannot add {type(value)} and {type(target_val)} for key {key}")
            else:
                target[key] = value

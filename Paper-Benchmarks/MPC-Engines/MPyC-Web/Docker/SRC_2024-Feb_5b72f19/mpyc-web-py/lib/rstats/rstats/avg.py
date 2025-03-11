from collections import deque

from .types import Numeric


class MovingAverage:
    def __init__(self, maxlen: int = 100):
        self._maxlen = maxlen
        self._ring = deque(maxlen=maxlen)
        self._total = 0

    def append(self, value: Numeric):
        if len(self._ring) == self._maxlen:
            self._total -= self._ring.popleft()
        self._total += value
        self._ring.append(value)

    def __len__(self):
        return len(self._ring)

    def __float__(self):
        if not self._ring:
            return 0.0
        return self._total / len(self._ring)

    def __str__(self):
        return str(float(self))

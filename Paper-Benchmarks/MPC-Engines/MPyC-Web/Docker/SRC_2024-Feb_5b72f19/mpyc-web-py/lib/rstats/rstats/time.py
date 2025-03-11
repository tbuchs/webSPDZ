from typing import TypedDict

from .avg import MovingAverage
from .format import metric
from .types import Numeric


class TimeStats:
    def __init__(self):
        self.initialized = False

        self.min = None
        self.max = 0
        self.avg = MovingAverage(maxlen=200)
        self.total: float = 0

    def update(self, t: float):
        self.initialized = True

        self.total += t

        self.avg.append(t)

        if self.min is None or self.min > t:
            self.min = t

        if self.max is None or self.max < t:
            self.max = t

    def __str__(self):
        if not self.initialized:
            return ""

        return f"∧ {_format_time(self.min)} / μ {_format_time(float(self.avg))} / ∨ {_format_time(self.max)} / ∑ {_format_time(self.total)}"

    def __repr__(self):
        return str(self)


def _format_time(time: Numeric | None):
    if time is None:
        return "-"

    return metric(time / 1_000_000, "s")

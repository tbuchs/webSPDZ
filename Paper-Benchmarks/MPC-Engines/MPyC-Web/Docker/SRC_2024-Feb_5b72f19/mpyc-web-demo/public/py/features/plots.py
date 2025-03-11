import time

import asciichartpy as acp
import numpy as np
from rich.live import Live
from rich.panel import Panel


def simple_sine(s):
    return np.sin(2 * np.pi * (0.1 * s))


def get_panel(data):
    return Panel(acp.plot(data), expand=False, title="~~ [bold][yellow]waves[/bold][/yellow] ~~")


with Live(auto_refresh=False) as live:
    d = []
    for i in range(1000):
        time.sleep(0.1)
        d.append(simple_sine(i))
        # pass only X latest
        live.update(get_panel(d[-50:]), refresh=True)

import asyncio
from cProfile import Profile
from pstats import SortKey, Stats

__all__ = ["prof"]


def process_stats(stats: Stats, amount=30):
    stats.sort_stats(SortKey.TIME)
    stats.print_stats(amount)
    stats.print_callers(amount)
    stats.dump_stats("/stats/dump.txt")
    stats.sort_stats(SortKey.CUMULATIVE)
    stats.print_stats(amount)
    stats.print_callers(amount)
    stats.dump_stats("/stats/dump2.txt")


async def _aprof(func, amount=30):
    with Profile() as profile:
        await func()
        process_stats(Stats(profile), amount)
        return profile


def _prof(func, amount=20):
    with Profile() as profile:
        func()
        process_stats(Stats(profile), amount)
        return profile


def prof(func, amount=20):
    if asyncio.iscoroutinefunction(func):
        return _aprof(func, amount)
    return _prof(func, amount)

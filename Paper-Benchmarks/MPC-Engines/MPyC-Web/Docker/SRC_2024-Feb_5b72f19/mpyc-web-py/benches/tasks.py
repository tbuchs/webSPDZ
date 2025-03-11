from asyncio import create_task, wait, run, ensure_future

# from time import process_time as time

from time import perf_counter as time


async def time_tasks(count=100) -> float:
    """Time creating and destroying tasks."""

    async def nop_task() -> None:
        """Do nothing task."""
        pass

    start = time()
    tasks = [create_task(nop_task()) for _ in range(count)]
    await wait(tasks)
    elapsed = time() - start
    return elapsed


async def do():
    for count in range(100_000, 1000_000 + 1, 100_000):
        create_time = 1 + await time_tasks(count)
        create_per_second = 1 / (create_time / count)
        print(f"{count:,} tasks \t {create_per_second:0,.0f} tasks per/s")


run(do())
# await do()

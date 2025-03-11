import asyncio
import logging
from time import perf_counter

import js
from mock import call
from pyodide.code import run_js
from rstats import bench

xx = 0
loop = asyncio.get_event_loop()

# print(loop._in_progress)

# print("------------------------")


def x():
    global xx
    print(xx)
    print(f"{xx=} {loop._in_progress=}")
    xx += 1

    pass


def cb():
    pass


@bench
async def async_nothing():
    pass


@bench
def sync_nothing():
    pass


@bench
def call_soon():
    loop.call_soon(cb)


@bench
async def async_sleep_0():
    await asyncio.sleep(0)


# call_soon()
# await async_sleep_0()
# sync_nothing()
# await async_nothing()

# for i in range(10):
#     loop.call_soon(x)


run_js("""
       
    function toString(t) {
        // return Math.round(t / 1000).toLocaleString()   
        return (Math.round(100*t)/100).toLocaleString()
    }
    
    let n = 2_000_0
    let ch = new MessageChannel()
    let xx = 0
    
    ch.port1.onmessage = (e) => {
        xx += 1
        if(xx >= n) {
            let tre = performance.now() - ts
            console.log("done receiving", toString(tre / 1000), toString(1000 * n / tre))
            self.postMessage(["proxy:js:display", `done receiving ${toString(tre / 1000)}, ${toString(1000 * n / tre)}\n`])
        }
    }
    
    console.log("start sending")
    self.postMessage(["proxy:js:display", `start sending\n`])
    let ts = performance.now()
    for (let i = 0; i < n; i++) {
        ch.port2.postMessage(undefined)
    }
    
    let tse = performance.now() - ts
    self.postMessage(["proxy:js:display", `done sending ${toString(tse / 1000)}, ${toString(1000 * n / tse)}\n`])
    console.log("done sending", toString(tse / 1000), toString(1000 * n / tse))
""")


ch = run_js("""
    new MessageChannel()
""")

nul = run_js("""null""")

n = 200_000


def call_callback(self, *args, **kwargs):
    global xx
    xx += 1
    if xx >= n:
        tre = perf_counter() - ts
        logging.info(f"done receiving {round(tre)} {round(n / tre)}")


ch.port1.onmessage = call_callback

logging.info("start")

ts = perf_counter()
for i in range(n):
    ch.port2.postMessage(nul)
tse = perf_counter() - ts
logging.info(f"done sending {round(tse)} {round(n / tse)}")

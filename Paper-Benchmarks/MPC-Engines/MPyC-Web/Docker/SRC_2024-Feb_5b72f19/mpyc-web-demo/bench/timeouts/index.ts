'use strict';

import { BenchSuite } from "../../src/ts/bench";
import { sleep_callSoon_async, sleep_callSoon_singleChan } from "../../src/ts/utils";


export class TimeoutsBench extends BenchSuite {
    x = 3

    async sleep_singleChan() {
        await sleep_callSoon_singleChan(0)
    }
    async sleep_async() {
        await sleep_callSoon_async(0)
    }

    sync_nothing() {
    }

    async async_nothing() {
    }


    async add() {
        1 + 1
    }

    async add2(a, b, c) {
        a = 1
        b = 2
        c = a + b
    }


    add3(a, b, c = 4) {
        return a + b
    }

    loopz() {

        let x = 1
        for (let i = 0; i < 1000; i++) {
            x += i
        }
        return x
    }
}




export async function main() {
    await TimeoutsBench.run2()
}

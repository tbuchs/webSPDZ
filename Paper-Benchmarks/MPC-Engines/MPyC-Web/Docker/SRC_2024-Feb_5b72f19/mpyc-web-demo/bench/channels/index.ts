'use strict';

export function main() {

    let out = document.querySelector<HTMLDivElement>("#out")

    let n = 11111
    let ch = new MessageChannel()
    let xx = 0

    // function toString() {
    //     return `${this.name}\t\t${Math.round(1000 * this.N / (this.duration + 1)).toLocaleString()} ops/sec`
    // }

    function toString(t) {
        // return Math.round(t / 1000).toLocaleString()   
        return Math.round(t).toLocaleString()
    }

    ch.port1.onmessage = (e) => {
        xx += 1
        if (xx >= n) {
            let tre = performance.now() - ts

            out.innerHTML += `done receiving, ${toString(tre / 1000)}, ${toString(1000 * n / tre)} <br>`
        }
    }

    out.innerHTML += `start sending <br>`

    let ts = performance.now()

    for (let i = 0; i < n; i++) {
        ch.port2.postMessage("")
    }

    let tse = performance.now() - ts


    out.innerHTML += `done sending, ${toString(tse / 1000)}, ${toString(1000 * n / tse)} <br>`
}

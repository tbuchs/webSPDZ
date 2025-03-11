'use strict';

export function main() {
    let out = document.querySelector("#out")
    function log(msg, t, n) {
        out.innerHTML += `${msg}, ${toString(t / 1000)}, ${toString(1000 * n / t)} <br>`
    }
    function toString(t) {
        // return Math.round(t / 1000).toLocaleString()   
        return (Math.round(100 * t) / 100).toLocaleString()
    }

    let n = 3_000_000
    let ch = new MessageChannel()
    let xx = 0

    ch.port1.onmessage = (e) => {
        xx += 1
        if (xx > 1000000 - 10) {
            log("done up to", 1000 * xx, 0)
            log("n=", 1000 * n, 0)
            ch.port2.postMessage(undefined)
        }
        if (xx % 100000 === 0) {
            log("done up to", 1000 * xx, 0)
            log("n=", 1000 * n, 0)
            ch.port2.postMessage(undefined)


        }
        if (xx >= n) {
            ch.port2.postMessage(undefined)
            let tre = performance.now() - ts
            // console.log("done receiving", toString(tre / 1000), toString(1000 * n / tre))
            // self.postMessage(["proxy:js:display", `done receiving ${toString(tre / 1000)}, ${toString(1000 * n / tre)}\n`])
            log("done receiving", tre, n)
        }
    }

    console.log("start sending")
    log("start sending", 1, 1)
    // self.postMessage(["proxy:js:display", `start sending\n`])
    let ts = performance.now()
    for (let i = 0; i < n; i++) {
        ch.port2.postMessage(undefined)
    }

    let tse = performance.now() - ts
    // self.postMessage(["proxy:js:display", `done sending ${toString(tse / 1000)}, ${toString(1000 * n / tse)}\n`])
    log("done sending", tse, n)
    console.log("done sending", toString(tse / 1000), toString(1000 * n / tse))

}

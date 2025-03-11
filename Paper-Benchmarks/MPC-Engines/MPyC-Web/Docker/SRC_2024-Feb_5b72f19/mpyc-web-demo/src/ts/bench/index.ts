import { logTable, sleep, tableLogger } from "../utils"


// Ported from Go's testing.B: https://cs.opensource.google/go/go/+/refs/tags/go1.21.3:src/testing/benchmark.go;l=293

type benchOpts = Required<{
    name?: string
    setupFn: (b: Benchmark) => void
    logEnabled?: boolean
    logSelector?: string
    runtimeGoalMS: number
    this?: any
}>

export abstract class BenchSuite {
    static async run2(opts: Partial<benchOpts> = {}, instance?: any) {
        const target = instance ? Object.getPrototypeOf(instance) : this.prototype

        for (const methodName of Object.getOwnPropertyNames(target)) {
            if (methodName == "constructor") continue
            await bench(target[methodName].bind(instance || target), { ...opts, name: `${opts.name || target.constructor.name} - ${methodName}` })
            await sleep(0)
        }
    }

    async run(opts: Partial<benchOpts> = {}) {
        await BenchSuite.run2(opts, this)
    }
}


export const bench = async (fn: (b: Benchmark) => any, opts: Partial<benchOpts> = {}) => {
    opts = { ...defaultOpts, ...opts }

    let B = new Benchmark(fn, opts)

    await B.run()

    if (opts.logEnabled) {
        B.logTable(opts.logSelector)
    }

    return B;
}

const defaultOpts = {
    name: "",
    setupFn: () => { },
    logEnabled: true,
    logSelector: "#out",
    runtimeGoalMS: 500,
    this: undefined,
}

export class Benchmark {
    protected _N: number = 0
    protected _I: number = 0
    protected _duration: number = 0
    protected benchFunc: (b: Benchmark) => any = () => { }
    protected startTime: number = 0
    protected timerOn: boolean = false
    protected opts: benchOpts

    get N() {
        return this._N
    }
    get I() {
        return this._I
    }
    get duration() {
        return this._duration
    }
    get name() {
        return this.opts.name
    }

    get result() {
        return {
            name: this.name,
            N: this.N.toLocaleString,
            duration: this.duration.toLocaleString
        }
    }

    constructor(fn: (b: Benchmark) => any, opts: Partial<benchOpts> = {}) {
        this.opts = { ...defaultOpts, ...opts }
        this.benchFunc = fn
    }

    StartTimer() {
        if (this.timerOn) {
            return
        }
        this.startTime = performance.now()
        this.timerOn = true
    }
    StopTimer() {
        if (!this.timerOn) {
            return
        }

        this._duration += performance.now() - this.startTime
        this.timerOn = false
    }
    ResetTimer() {
        if (this.timerOn) {
            this.startTime = performance.now()
        }

        this._duration = 0
    }

    run = async () => {
        await this.runN(1)

        for (let n = 1; this._duration <= this.opts.runtimeGoalMS && n < 1e9;) {
            let last = n;
            // Predict required iterations.
            let prevIters = this._N
            let prevms = this._duration;
            if (prevms <= 0) {
                // Round up, to avoid div by zero.
                prevms = 1
            }

            // Order of operations matters.
            // For very fast benchmarks, prevIters ~= prevns.
            // If you divide first, you get 0 or 1,
            // which can hide an order of magnitude in execution time.
            // So multiply first, then divide.
            n = Math.floor(this.opts.runtimeGoalMS * prevIters / prevms)
            // Run more iterations than we think we'll need (1.2x).
            n += Math.floor(n / 5)
            // Don't grow too fast in case we had timing errors previously.
            n = Math.min(n, 100 * last)
            // Be sure to run at least one more than last time.
            n = Math.max(n, last + 1)
            // Don't run more than 1e9 times.
            n = Math.min(n, 1e9)
            // console.log(`Running ${n.toLocaleString()} iterations`)
            await this.runN(n)
            // console.log(`Running ${n.toLocaleString()} iterations...done`)
        }
    }

    protected runN = async (n: number) => {
        this._N = n

        // console.log("setup")
        for (this._I = 0; this._I < n; this._I++) {
            this.opts.setupFn(this)
        }
        // console.log("setup...done")
        // console.log("bench")
        this.ResetTimer()
        this.StartTimer()
        for (this._I = 0; this._I < n; this._I++) {
            // await this.benchFunc.apply(this.opts.this, [this])
            await this.benchFunc(this)
        }
        this.StopTimer()
        // console.log("bench...done", this._duration.toLocaleString())
    }

    toString() {
        return `${this.name}\t\t${Math.round(1000 * this.N / (this.duration + 1)).toLocaleString()} ops/sec`
    }

    toStrings() {
        return [this.name, `${Math.round(1000 * this.N / (this.duration + 1)).toLocaleString()} ops/sec`]
    }

    logTable(selector = "#out") {
        tableLogger(selector, ["Name", "Ops/sec"])(...this.toStrings())
    }
}

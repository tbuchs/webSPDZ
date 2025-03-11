
import Emittery from 'emittery';
import { MPCManager } from "../mpyc";
import { RuntimeEvents } from '../mpyc/events';


export type RunMPCOptions = {
    pid: number,
    parties: string[],
    is_async: boolean,
    no_async: boolean,
    code: string,
    filename: string

}

// type MPCRuntimeManager = EventEmitter<MPCEvents>
export type MPCRuntimeManager = MPCManager

interface ChanSync {

}

interface ChanAsync {

}
type options = {
    peerID?: string
    // shimFilePath: string
    // configFilePath: string
    env?: { [key: string]: string }
}

declare global {
    interface MessagePort {
        onerror: (err: ErrorEvent) => void;
    }
}

// export abstract class MPCRuntimeBase extends EventEmitter<RuntimeEvents> {
export abstract class MPCRuntimeBase extends Emittery<RuntimeEvents> {
    peersReady: Map<string, boolean> = new Map<string, boolean>();
    workerInitializing = false;
    running = false;
    env = {}

    syncProxyPy: any;
    asyncProxyPy: MessagePort;

    abstract type(): string

    // constructor( emitter: MPCRuntimeManager, shimFilePath: string, configFilePath: string, env: any = {},) {
    constructor(syncProxyPy: any, asyncProxyPy: MessagePort, env: any = {}) {
        super()

        syncProxyPy.getEnv = this.getEnv.bind(this)
        // chanAsync.onmessageerror = this.onmessageerror.bind(this)
        // chanAsync.onerror = this.onerror.bind(this)

        this.syncProxyPy = syncProxyPy
        this.asyncProxyPy = asyncProxyPy

        syncProxyPy.fetch = this.fetch.bind(this)
        asyncProxyPy.onerror = (err: ErrorEvent) => {
            console.warn("asyncProxyPy.onerror");
            console.warn(err);
            // console.warn(typeof err);
            // console.warn(err.toString());
            this.emit('error', err)
        };
        asyncProxyPy.onmessageerror = (err: MessageEvent) => { console.warn("asyncProxyPy.onmessageerror"); console.warn(err); this.emit('messageerror', err) };
        // console.warn("setting onmessage", asyncProxyPy)
        asyncProxyPy.onmessage = (e: MessageEvent) => {
            let data = e.data

            if (!Array.isArray(data)) {
                console.warn("asyncProxyPy.onmessage", data)
                this.emit("display:error", "invalid message from worker \n" + JSON.stringify(data, null, 2) + "\n")
                return
            }

            const [type, ...args] = data;
            switch (type) {
                case "proxy:js:init":
                    this.workerInitializing = true;
                    this.updateEnv()
                    break;
                case "proxy:js:mpc:exec:done":
                    this.emit('exec:done')
                    break;
                case "proxy:js:runtime:ready":
                    this.emit('ready')
                    break;
                case "proxy:js:display:stats":
                    let [stats] = args
                    this.emit('display:stats', stats);
                    break;

                case "proxy:js:mpc:msg:ready":
                    let [pid1, message1] = args
                    // console.log(message1, typeof message1)
                    if (message1.getBuffer) {
                        message1 = message1.getBuffer()
                    }
                    this.emit('send', { type: "ready", pid: pid1, payload: message1 })
                    break;
                case "proxy:js:mpc:msg:runtime":
                    // console.log("js sending runtime message")
                    let [pid2, message2] = args
                    // console.log(message2, typeof message1)
                    if (message2.getBuffer) {
                        message2 = message2.getBuffer()
                    }
                    this.emit('send', { type: "runtime", pid: pid2, payload: message2 })
                    break;
                case "proxy:js:display":
                    let [text] = args
                    this.display(text)
                    break;

                case "proxy:js:display:error":
                    let [text2] = args
                    this.displayError(text2 + "\n")
                    break;
            }
        };

        this.env = env;
    }

    exec = async (code: string) => {
        try {
            console.log("exec")
            this.asyncProxyPy.postMessage(["proxy:py:exec", code])
        } catch (err) {
            console.error(err)
            this.emit('error', new ErrorEvent('runtime:error', { error: err }))
        }

        // this.emit('exec:done');
    }

    run_mpc = async (options: RunMPCOptions) => {
        this.emit('exec:init');
        if (!options.filename) {
            options.filename = "<exec>"
        }

        try {
            console.log("run_mpc", options)
            this.asyncProxyPy.postMessage(["proxy:py:mpc:exec", options])

        } catch (err) {
            console.error(err)
            this.emit('error', new ErrorEvent('runtime:error', { error: err }))
        }

        // this.emit('exec:done');
    }

    processReadyMessage(pid: number, message: string): void {
        this.asyncProxyPy.postMessage(["proxy:py:mpc:ready", pid, message])
    }

    processRuntimeMessage(pid: number, message: any): void {
        try {
            let transfer = undefined
            if (message && message instanceof Uint8Array) {
                transfer = [message.buffer]
            }
            // await this.asyncProxyPy.postMessage(["proxy:py:mpc:runtime", pid, message])
            if (transfer) {
                this.asyncProxyPy.postMessage(["proxy:py:mpc:runtime", pid, message], transfer)
                return
            }
            this.asyncProxyPy.postMessage(["proxy:py:mpc:runtime", pid, message])

        } catch (err) {
            console.warn("runtime:error")
            console.warn("runtime:error", err)
            this.emit('error', new ErrorEvent('runtime:error', { error: err }))
        }
    }
    updateEnv(env = {}) {
        this.env = { ...(this.env), ...env };
        if (this.workerInitializing) {
            this.asyncProxyPy.postMessage(["proxy:py:env:update", this.env]);
        }
    }
    fetch2 = async (url: string) => {
        console.log("fetching", url)
        let res = await fetch("./" + url);
        let ab = await res.arrayBuffer();
        return new Uint8Array(ab);
    };
    fetch = async (url: string) => {
        // if(!url.startsWith("http")) {
        //     url = "./" + url
        // }
        if (url.endsWith(".gz")) {
            url += "ip"
        }

        console.log("js/fetch fetching", url)
        let res = await fetch(url);
        // if (!res.ok) {
        //     throw new Error("fetch failed: " + res.status + " " + res.statusText)
        // }

        let ab = await res.arrayBuffer();
        return new Uint8Array(ab);
    }

    getEnv = () => { return this.env; }

    readline = (prompt: string) => { }


    abstract _close(): void;

    destroy() {
        console.log("destroying worker");
        this.running = false;
        this._close();
    }

    protected display = (message: string) => {
        this.emit('display', message);
    }
    protected displayError = (message: string) => {
        this.emit('display:error', message);
    }

    resetStats() {
        this.asyncProxyPy.postMessage(["proxy:py:stats:reset"])
    }

    toggleStats() {
        this.asyncProxyPy.postMessage(["proxy:py:stats:toggle"])
    }

    showStats() {
        this.asyncProxyPy.postMessage(["proxy:py:stats:show"])
    }

    hideStats() {
        this.asyncProxyPy.postMessage(["proxy:py:stats:hide"])
    }


    onerror = (err: ErrorEvent) => { console.warn("MPCRuntime.onerror"); console.warn(err.error); this.emit('error', err) };
    onmessageerror = (err: MessageEvent) => { console.warn("MPCRuntime.onmessageerror"); console.warn(err); this.emit('messageerror', err) };

    setReadlineFn(readline: ((prompt: string) => Promise<string>)) {
        this.readline = readline
        this.syncProxyPy.readline = readline
    }

}


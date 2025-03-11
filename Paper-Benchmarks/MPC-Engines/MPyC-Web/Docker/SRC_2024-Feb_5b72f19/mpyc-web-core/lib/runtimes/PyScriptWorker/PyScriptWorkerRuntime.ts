
// import { PyWorker } from "https://cdn.jsdelivr.net/npm/@pyscript/core";
import { Hook, XWorker } from "polyscript/xworker";
// import mpycweb from './mpyc_web-0.4.0-py3-none-any.whl?raw'
// import startup from '../../../../public/py/mpycweb/shim/shim.py?raw'
// import { XWorker, Hook } from "polyscript";
import { MPCRuntimeBase } from '../MPCRuntimeBase';

function XXWorker(startupURL: string, configFilePath: string | any, hooks: any) {
    let opts: unknown = {
        async: true, type: "pyodide", version: "0.26.0a2", config: configFilePath
        // async: true, type: "pyodide", version: "https://cdn.jsdelivr.net/pyodide/dev/full/pyodide.mjs", config: configFilePath
    }

    console.log("creating a new worker")
    // return PyWorker(shimFilePath, { async: true, config: configFilePath });
    return XWorker.call(new Hook(null, hooks), startupURL, opts as Required<WorkerOptions>);
    // return XWorker(shimFilePath, { async: true, type: "pyodide", config: configFilePath })
}

let blobURL = (code: string) => {
    return URL.createObjectURL(
        new Blob([code], {
            type: "text/plain",
        }),
    )
}

let emptyBlob = URL.createObjectURL(
    new Blob([``], {
        type: "text/plain",
    }),
)

type PyScriptWorkerRuntimeOptions = {
    startup?: string | any,
    config?: string | any,
    env?: any
}
export class PyScriptWorkerRuntime extends MPCRuntimeBase {
    _close(): void {
        this.worker.terminate()
    }
    worker: Worker;

    constructor(opts?: PyScriptWorkerRuntimeOptions) {
        let startup = emptyBlob;
        let config: string | any = {
            packages: ["mpyc-web"],
        };

        if (opts?.startup && opts?.startup != "") {
            startup = opts.startup
        }

        if (opts?.config && typeof opts?.config === 'string' && opts?.config != "") {
            config = opts.config
        }

        if (opts?.config && typeof opts?.config === 'object') {
            opts.config.packages ||= []
            opts.config.packages.push("numpy", "gmpy2")

            config = { ...config, ...opts.config }
        }

        let worker = XXWorker(startup, config, {
            worker: {
                onReady: async (wrap: any, xworker: ReturnType<typeof XXWorker>) => {
                    console.log("worker onReady/init")

                    wrap.io.stderr = (message: any) => {
                        if (typeof message != "string") {
                            message = message.toString()
                        }
                        console.error(message)
                        xworker.postMessage(["proxy:js:display:error", message])
                    }

                    wrap.io.stdout = (message: string) => {
                        xworker.postMessage(["proxy:js:display", message + "\n"])
                        // self.postMessage(["proxy:js:display", message + "\n"])
                    }

                    xworker.postMessage(["proxy:js:init"])

                    self.wrap = wrap;
                    self.pyodide = wrap.interpreter
                    console.log(self.pyodide)
                    // wrap.interpreter.setStdin(true)
                    // wrap.interpreter.setStdout(true)
                    wrap.interpreter.setDebug(true)

                    self.runAsync = async (code: string, filename: string) => {
                        try {
                            return await wrap.interpreter.runPythonAsync(code, { filename: filename });
                        }
                        catch (error) {
                            wrap.io.stderr(error);
                        }
                    };

                    // self.runAsync(wrap, startup, { filename: "startup.py" })
                    self.runAsync(`
                        import asyncio
                        import js
                        import sys
                        from startup import *
                    `, "startup.py")
                }
            }
        });

        worker.onmessageerror = (e) => {
            console.error("worker.onmessageerror")
            console.error(e)
        }
        worker.onerror = (e) => {
            console.error("worker.onerror")
            console.error(e)
        }
        // console.log(worker)

        super(worker.sync, worker, opts?.env)
        // worker.postMessage(["proxy:py:exec", startup])
        this.worker = worker;
    }

    type(): string {
        return "PyScript/Worker"
    }
}




declare global {
    interface Window {
        runAsync: (code: string, filename: string) => Promise<any>;
        counter: number;
    }
}

import { define } from "polyscript";
import { MPCRuntimeBase, RunMPCOptions } from '../MPCRuntimeBase';



type CustomOptions = Parameters<typeof define>[1]

export class PyScriptMainThreadRuntime extends MPCRuntimeBase {
    interpreter: any;
    configFilePath: string;
    shimFilePath: string;
    chan: MessageChannel;

    __run_mpc: (RunMPCOptions) => Promise<void>;

    update_env(env: { [key: string]: string; }): void {
        throw new Error('Method not implemented.');
    }
    processReadyMessage(pid: number, payload: any): void {
        throw new Error('Method not implemented.');
    }
    processRuntimeMessage(pid: number, payload: any): void {
        throw new Error('Method not implemented.');
    }


    constructor(shimFilePath: string, configFilePath: string, env = {}) {
        const chan = new MessageChannel();
        const obj = {}

        super(obj, chan.port1, env)

        this.chan = chan
        this.shimFilePath = shimFilePath
        this.configFilePath = configFilePath
        self.MPCRuntimeAsyncChannel = this.chan.port2;

        this.init()
    }


    _setReadlineFn(readline: ((prompt: string) => Promise<string>)) {
        // this.worker.sync.readline = readline
    }
    async _run_mpc({ pid, parties, is_async, code }: RunMPCOptions): Promise<void> {
        await this.__run_mpc({
            pid,
            parties,
            is_async,
            no_async: !is_async,
            code: code,
        })
    }

    _close(): void {
        this.interpreter.terminate()
    }

    type(): string {
        return "PyScript/Main"
    }

    async init() {
        let $this = this

        return new Promise<void>((resolve, reject) => {
            define(null, {
                interpreter: "pyodide",
                config: this.configFilePath,
                hooks: {
                    main: {
                        onReady: async (wrap: any) => {
                            console.error(wrap)
                            this.interpreter = wrap.interpreter;

                            $this.__run_mpc = this.interpreter.runPython(`
                                from mpycweb import run_mpc
                                run_mpc
                            `);

                            wrap.io.stdout = (message: string) => {
                                $this.display(message)
                            }

                            wrap.io.stderr = (message: any) => {
                                console.warn("PyScriptInterpreter.stderr")
                                if (typeof message != "string") {
                                    message = message.toString()
                                }

                                $this.displayError(message)
                            }

                            // wrap.interpreter.setStderr({ isatty: true, write: (message: any) => { message = String.fromCharCode(...message); console.warn("zzzzzzzzzzzz", message); $this.displayError(message + "\n") } })

                            let shim = await fetch(this.shimFilePath)
                            let shimContent = await shim.text()

                            await wrap.interpreter.runPythonAsync(shimContent);
                            resolve();
                        },
                    },
                },
            } as CustomOptions);
        });
    }
}

const codedent = (tpl, ...values) => dedent[typeof tpl](tpl, ...values);

function content(...t) {
    for (var s = t[0], i = 1, l = arguments.length; i < l; i++)
        s += arguments[i] + t[i];
    return s;
}

const dedent = {
    object(...args) {
        return this.string(content(...args));
    },
    string(content) {
        for (const line of content.split(/[\r\n]+/)) {
            // skip initial empty lines
            if (line.trim().length) {
                // trap indentation at the very first line of code
                if (/^(\s+)/.test(line))
                    content = content.replace(new RegExp('^' + RegExp.$1, 'gm'), '');
                // no indentation? all good: get out of here!
                break;
            }
        }
        return content;
    }
};

declare global {
    interface Window {
        MPCRuntimeAsyncChannel: MessagePort;
    }
}

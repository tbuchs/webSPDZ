import { MPCRuntimeBase } from '../MPCRuntimeBase';
import PyodideWorker from './PyodideWorker?worker';

export class PyodideWorkerRuntime extends MPCRuntimeBase {
    type(): string {
        return "Pyodide/Worker"
    }

    callbacks = {};
    worker: Worker;
    id = 0; // identify a Promise

    constructor() {
        console.log("PyodideXWorker constructor")
        const worker: any = new PyodideWorker();
        console.log("PyodideXWorker constructor2")
        super({}, worker)

        this.worker = worker

        // this.worker.onmessage = (e: MessageEvent) => {
        //     // console.log("onmessage")
        //     // console.log("onmessage", e.data)
        //     let data = e.data as [string, ...any]
        //     const [type, ...args] = data
        //     // console.log(e.data, typeof e.data)

        //     switch (type) {
        //         case "result":
        //             const [id, ...data] = args;
        //             const onSuccess = this.callbacks[id];
        //             delete this.callbacks[id];
        //             onSuccess(data);
        //     }
        // };
    }

    _close(): void {
        this.worker.terminate()
    }
    asyncRun = (script: string, context: any) => {
        // the id could be generated more carefully
        this.id = (this.id + 1) % Number.MAX_SAFE_INTEGER;
        return new Promise((onSuccess) => {
            this.callbacks[this.id] = onSuccess;
            this.worker.postMessage({
                ...context,
                python: script,
                id: this.id,
            });
        });
    };

    // This should be the only helper needed for all Emscripten based FS exports
    writeFile = ({ FS, PATH, PATH_FS }, path, buffer) => {
        const absPath = PATH_FS.resolve(path);
        FS.mkdirTree(PATH.dirname(absPath));
        return FS.writeFile(absPath, new Uint8Array(buffer), {
            canOwn: true,
        });
    };
    writePythonFiles(files: Record<string, string | Record<string, string>>) {
        const python = ["from pathlib import Path as _Path"];

        const write = (
            base: string,
            literal: Record<string, string | Record<string, string>>,
        ) => {
            for (const key of Object.keys(literal)) {
                const value = literal[key];
                const path = `_Path("${base}/${key}")`;
                if (typeof value === "string") {
                    const code = JSON.stringify(value);
                    python.push(`${path}.write_text(${code})`);
                } else {
                    python.push(`${path}.mkdir(parents=True, exist_ok=True)`);
                    write(`${base}/${key}`, value);
                }
            }
        };

        write(".", files);

        python.push("del _Path");
        python.push("\n");

        return python.join("\n");
    }
}


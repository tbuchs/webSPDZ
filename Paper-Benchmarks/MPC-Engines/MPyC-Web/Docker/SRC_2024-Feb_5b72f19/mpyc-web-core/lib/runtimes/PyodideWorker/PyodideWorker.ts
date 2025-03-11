// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.json`,
// and `.wasm` files as well:
console.log("PyodideWorker.ts")




import startup from './startup.py?raw';

// import { loadPyodide } from 'pyodide'

const { parse, stringify } = JSON;


const getPolyscriptJSModule = (interpreter: any) => {


    console.log(interpreter.ffi)
    console.log(interpreter.ffi)
    const transform = (value) => (
        value instanceof interpreter.ffi.PyProxy ?
            value.toJs(toJsOptions) :
            value
    )

    // const { proxy: sync, window, isWindowProxy } = coincident(self, {
    //     parse,
    //     stringify,
    //     transform: value => transform ? transform(value) : value
    // });

    return {
        xworker: {
            // allows synchronous utilities between this worker and the main thread
            // sync,
            sync: { getEnv: () => { return {} } },
            // allow access to the main thread world
            // window,
            // allow introspection for foreign (main thread) refrences
            // isWindowProxy,
            // standard worker related events / features
            onmessage: console.info,
            onerror: console.error,
            onmessageerror: console.warn,
            postMessage: postMessage.bind(self),
        }
    };

}
const toJsOptions = { dict_converter: Object.fromEntries };

async function loadPyodideAndPackages() {
    // // Don't bother yet with this line, suppose our API is built in such a way:
    // const { id, python, ...context } = event.data;
    // // // The worker copies the context in its own "memory" (an object mapping name to values)
    // for (const key of Object.keys(context)) {
    //     self[key] = context[key];
    // }
    // // // Now is the easy part, the one that is similar to working in the main thread:
    // try {
    //     await self.pyodide.loadPackagesFromImports(python);
    //     let results = await self.pyodide.runPythonAsync(python);
    //     self.postMessage({ results, id });
    // } catch (error) {
    //     self.postMessage({ error: error.message, id });
    // }
}
console.error("loading pyodide")

self.onmessage = async (event) => {
    // make sure loading is done
    // await pyodideReadyPromise;
    await self.pyodide.runPythonAsync(startup)

    console.log("event")
    console.error(event)

};

// self.pyodide = await loadPyodide({
//     stdout: (message: any) => {
//         console.warn("stdout");
//         console.warn(message)
//         self.postMessage(["proxy:js:display", message.toJS()])
//     },
//     stderr: (message: any) => {
//         console.warn("stderr")
//         console.warn(message)
//         self.postMessage(["proxy:js:display:error", message.toJS()])
//     },
//     packages: ["micropip", "pygments", "numpy", "gmpy2", "pyyaml", "/py/mpyc_web-0.4.0-py3-none-any.whl", "https://files.pythonhosted.org/packages/be/2a/4e62ff633612f746f88618852a626bbe24226eba5e7ac90e91dcfd6a414e/rich-13.6.0-py3-none-any.whl"]
// });


// console.warn(stringToByteArray(startup))
// console.warn(typeof mpycweb)
// await self.pyodide.FS.writeFile("./mpyc_web-0.4.0-py3-none-any.whl", stringToByteArray(startup))
// let micropip = await self.pyodide.pyimport("micropip")
// await micropip.install("emfs:./mpyc_web-0.4.0-py3-none-any.whl")
// console.error("done loading pyodide")
// await self.pyodide.loadPackage("emfs:./mpyc_web-0.4.0-py3-none-any.whl")
// await self.pyodide.loadPackage(["numpy", "pytz"]);




// self.pyodide.registerJsModule('polyscript', getPolyscriptJSModule(self.pyodide));

self.pyodide.runPython(startup)

// // This should be the only helper needed for all Emscripten based FS exports
// const writeFile = ({ FS, PATH, PATH_FS } = self.pyodide, path, buffer) => {
//     const absPath = PATH_FS.resolve(path);
//     FS.mkdirTree(PATH.dirname(absPath));
//     return FS.writeFile(absPath, new Uint8Array(buffer), {
//         canOwn: true,
//     });
// };

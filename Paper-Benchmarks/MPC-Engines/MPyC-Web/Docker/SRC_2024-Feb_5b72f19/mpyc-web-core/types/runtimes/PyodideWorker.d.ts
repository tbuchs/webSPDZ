import { PyodideInterface } from 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
declare global {
    interface Window {
        pyodide: PyodideInterface;
        writeFile: any;
        onmessage: any;
    }
}

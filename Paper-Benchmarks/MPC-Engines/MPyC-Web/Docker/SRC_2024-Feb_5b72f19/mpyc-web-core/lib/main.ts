'use strict';


export * from './mpyc';
export * from './runtimes';
export * from './transports';
export * from './utils';

declare global {
    interface Window {
        pyodide: any;
        writeFile: any;
        onmessage: any;
    }
}

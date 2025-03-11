import { MPCRuntimeBase } from './MPCRuntimeBase';
export declare class PyScriptWorkerRuntime extends MPCRuntimeBase {
    _close(): void;
    worker: Worker;
    constructor(shimFilePath: string, configFilePath: string, env?: any);
    type(): string;
}
declare global {
    interface Window {
        runAsync: any;
    }
}

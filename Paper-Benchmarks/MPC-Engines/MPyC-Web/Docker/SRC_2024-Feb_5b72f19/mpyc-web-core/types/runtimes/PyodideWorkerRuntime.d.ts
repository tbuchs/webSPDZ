import { MPCRuntimeBase } from './MPCRuntimeBase';
export declare class PyodideWorkerRuntime extends MPCRuntimeBase {
    type(): string;
    callbacks: {};
    worker: Worker;
    id: number;
    constructor();
    _close(): void;
    asyncRun: (script: string, context: any) => Promise<unknown>;
    writeFile: ({ FS, PATH, PATH_FS }: {
        FS: any;
        PATH: any;
        PATH_FS: any;
    }, path: any, buffer: any) => any;
    writePythonFiles(files: Record<string, string | Record<string, string>>): string;
}

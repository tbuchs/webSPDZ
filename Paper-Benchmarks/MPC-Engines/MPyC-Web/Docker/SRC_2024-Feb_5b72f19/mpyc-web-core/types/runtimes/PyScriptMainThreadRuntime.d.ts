import { MPCRuntimeBase, RunMPCOptions } from './MPCRuntimeBase';
export declare class PyScriptMainThreadRuntime extends MPCRuntimeBase {
    interpreter: any;
    configFilePath: string;
    shimFilePath: string;
    chan: MessageChannel;
    __run_mpc: (RunMPCOptions: any) => Promise<void>;
    update_env(env: {
        [key: string]: string;
    }): void;
    processReadyMessage(pid: number, payload: any): void;
    processRuntimeMessage(pid: number, payload: any): void;
    constructor(shimFilePath: string, configFilePath: string, env?: {});
    _setReadlineFn(readline: ((prompt: string) => Promise<string>)): void;
    _run_mpc({ pid, parties, is_async, code }: RunMPCOptions): Promise<void>;
    _close(): void;
    type(): string;
    init(): Promise<void>;
}
declare global {
    interface Window {
        MPCRuntimeAsyncChannel: MessagePort;
    }
}

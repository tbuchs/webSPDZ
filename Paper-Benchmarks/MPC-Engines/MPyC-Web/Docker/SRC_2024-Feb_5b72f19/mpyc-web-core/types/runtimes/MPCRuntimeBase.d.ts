import { RuntimeEvents } from '../mpyc/events';
import { MPCManager } from "../mpyc";
import Emittery from 'emittery';
export type RunMPCOptions = {
    pid: number;
    parties: string[];
    is_async: boolean;
    no_async: boolean;
    code: string;
    filename: string;
};
export type MPCRuntimeManager = MPCManager;
declare global {
    interface MessagePort {
        onerror: (err: ErrorEvent) => void;
    }
}
export declare abstract class MPCRuntimeBase extends Emittery<RuntimeEvents> {
    peersReady: Map<string, boolean>;
    workerInitializing: boolean;
    running: boolean;
    env: {};
    syncProxyPy: any;
    asyncProxyPy: MessagePort;
    abstract type(): string;
    constructor(syncProxyPy: any, asyncProxyPy: MessagePort, env?: any);
    exec: (code: string) => Promise<void>;
    run_mpc: (options: RunMPCOptions) => Promise<void>;
    processReadyMessage(pid: number, message: string): void;
    processRuntimeMessage(pid: number, message: any): void;
    updateEnv(env?: {}): void;
    fetch: (url: string) => Promise<Uint8Array>;
    getEnv: () => {};
    readline: (prompt: string) => void;
    abstract _close(): void;
    destroy(): void;
    display: (message: string) => void;
    displayError: (message: string) => void;
    onerror: (err: ErrorEvent) => void;
    onmessageerror: (err: MessageEvent) => void;
    setReadlineFn(readline: ((prompt: string) => Promise<string>)): void;
}

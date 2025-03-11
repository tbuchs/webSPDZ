import Emittery from 'emittery';
import { MPCEvents, Transport } from './events';
import { MPCRuntimeBase } from "../runtimes/MPCRuntimeBase";
export declare class MPCManager extends Emittery<MPCEvents> {
    transport: Transport;
    peerIDToPID: Map<string, number>;
    pidToPeerID: Map<number, string>;
    peersReady: Map<string, boolean>;
    runtime: MPCRuntimeBase;
    running: boolean;
    runtimeFactory: () => MPCRuntimeBase;
    transportFactory: () => Transport;
    env: {
        [key: string]: string;
    };
    constructor(transportFactory: () => Transport, runtimeFactory: () => MPCRuntimeBase, env?: any);
    newTransport(transportFactory: () => Transport): Transport;
    newRuntime(runtimeFactory?: () => MPCRuntimeBase): MPCRuntimeBase;
    private addTransportEvents;
    private addRuntimeEvents;
    runMPC(code: string, filename: string, is_async?: boolean): void;
    reset(transportFactory?: () => Transport, runtimeFactory?: () => MPCRuntimeBase): void;
    resetTransport(transportFactory?: () => Transport): void;
    resetRuntime(runtimeFactory?: () => MPCRuntimeBase): void;
    sendMPCMessage(type: string, pid: number, message: any): void;
    processReadyMessage: (peerID: string, message: string) => void;
    processRuntimeMessage: (peerID: string, message: any) => void;
}
declare global {
    interface Worker {
        sync: any;
    }
    interface Window {
        wrap: any;
    }
}

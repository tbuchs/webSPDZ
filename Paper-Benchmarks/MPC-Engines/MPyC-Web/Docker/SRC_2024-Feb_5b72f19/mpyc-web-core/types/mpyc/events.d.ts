import Emittery from 'emittery';
export type MPCEvents = {
    'runtime:error': ErrorEvent;
    'runtime:message': MessageEvent;
    'runtime:messageerror': MessageEvent;
    'runtime:exec:init': never;
    'runtime:exec:done': never;
    'runtime:display': string;
    'runtime:display:error': string;
    'runtime:display:stats': string;
    'runtime:ready': never;
    'transport:ready': string;
    'transport:closed': never;
    'transport:error': Error;
    'transport:conn:ready': string;
    'transport:conn:disconnected': string;
    'transport:conn:error': {
        peerID: string;
        err: Error;
    };
    'transport:conn:data:mpyc': {
        peerID: string;
        data: MPyCReadyData | MPyCRuntimeData;
    };
    'transport:conn:data:custom': {
        peerID: string;
        data: AnyData;
    };
};
export interface Conn {
    send(data: any): void;
    close(): void;
}
export interface Transport extends Emittery<TransportEvents> {
    connect(peerID: string): void;
    getPeers(includeSelf?: boolean): string[];
    send(peerID: string, type: string, payload: any): void;
    destroy(): void;
    reconnect(): void;
    id(): string;
    broadcast(type: string, payload: any): void;
}
export declare class TransportEvents {
    'ready': string;
    'closed': never;
    'error': Error;
    'conn:ready': string;
    'conn:disconnected': string;
    'conn:error': {
        peerID: string;
        err: Error;
    };
    'conn:data': {
        peerID: string;
        data: AnyData;
    };
}
export declare class PassThroughRuntimeEvents {
    'ready': never;
    'exec:init': never;
    'exec:done': never;
    'error': ErrorEvent;
    'message': MessageEvent;
    'messageerror': MessageEvent;
    'display': string;
    'display:error': string;
    'display:stats': string;
}
export type RuntimeEvents = PassThroughRuntimeEvents & {
    'send': {
        type: string;
        pid: number;
        payload: any;
    };
};
export type MPyCReadyData = {
    type: 'mpyc:ready';
    payload: string;
};
export type MPyCRuntimeData = {
    type: 'mpyc:runtime';
    payload: Uint8Array;
};
export type AnyData = {
    type: string;
    payload: any;
};
export type PeerJSData = MPyCReadyData | MPyCRuntimeData | AnyData;
export type PeersData = {
    type: 'peers';
    payload: string[];
};
export type PeerJSTransportData = PeersData | AnyData;

import { Peer, DataConnection } from "peerjs";
import Emittery from 'emittery';
import { TransportEvents, Transport } from '../mpyc/events';
type ConnMap = Map<string, DataConnection>;
export declare class PeerJSTransport extends Emittery<TransportEvents> implements Transport {
    peer: Peer;
    conns: ConnMap;
    constructor(peerID: string | null);
    reconnect(): void;
    id: () => string;
    private addPeerEventHandlers;
    private addConnEventHandlers;
    send(peerID: string, type: string, payload: any): Promise<void>;
    destroy(): void;
    private processNewPeers;
    broadcast(type: string, payload: any): Promise<void>;
    private sendPeers;
    getPeers(includeSelf?: boolean): string[];
    connect(peerID: string): Promise<void>;
}
export {};

import { DataConnection, Peer, PeerOptions } from "peerjs";

import Emittery from 'emittery';
import { PeerJSTransportData, Transport, TransportEvents } from '../mpyc/events';

type ConnMap = Map<string, DataConnection>;


// export class PeerJSTransport extends EventEmitter<TransportEvents> implements Transport {
export class PeerJSTransport extends Emittery<TransportEvents> implements Transport {
    peer: Peer;
    conns: ConnMap = new Map<string, DataConnection>();

    constructor(peerID?: string) {
        super()
        let opts: PeerOptions = {
            // debug: 3,
            // secure: true,
            secure: true,
            // host: "mpyc-demo--headscale-ams3-c99f82e5.demo.mpyc.tech",
            // port: 443,
            // config: {
            //     iceServers: [
            //         { urls: "stun:stun.l.google.com:19302" },
            //         {
            //             urls: [
            //                 "turn:eu-0.turn.peerjs.com:3478",
            //                 // "turn:us-0.turn.peerjs.com:3478",
            //             ],
            //             username: "peerjs",
            //             credential: "peerjsp",
            //         },
            //     ],
            //     sdpSemantics: "unified-plan",
            // }

            // pingInterval: 2345,
        };

        try {

            if (peerID) {
                this.peer = new Peer(peerID, opts);
            } else {
                this.peer = new Peer(opts);
            }
        } catch (err) {
            console.warn(err)
        }
        this.addPeerEventHandlers(this.peer)

    }

    reconnect() {
        this.peer.reconnect();
    }

    id = () => this.peer.id;

    private addPeerEventHandlers(peer: Peer) {
        peer.on('open', async (peerID) => { this.emit('ready', peerID); });
        peer.on('error', async (err) => { this.emit('error', err); });
        peer.on('close', async () => { this.emit('closed'); });
        peer.on('connection', async (conn: DataConnection) => { this.addConnEventHandlers(conn); });
    }

    private addConnEventHandlers(conn: DataConnection) {
        console.log(`transport:conn ${conn.peer} is trying to connect`)
        conn.on('open', async () => {
            this.conns.set(conn.peer, conn);
            this.sendPeers(conn);
            this.emit('conn:ready', conn.peer);
        });
        conn.on('error', async (err: Error) => { this.emit('conn:error', { peerID: conn.peer, err }) });
        conn.on('close', async () => {
            this.conns.delete(conn.peer);
            this.emit('conn:disconnected', conn.peer);
        });

        conn.on('data', async (data: PeerJSTransportData) => {
            let { type, payload } = data;

            switch (type) {
                case 'peers':
                    this.processNewPeers(payload);
                    break;
                default:
                    this.emit(`conn:data`, { peerID: conn.peer, data });
                    break;
            }
        });
    }

    async send(peerID: string, type: string, payload: any) {
        // console.warn("sending", peerID, typeof peerID)
        // console.warn("sending", peerID, this.conns, this.conns[peerID])
        this.conns.get(peerID).send({ type, payload });
    }


    destroy() {
        this.peer.destroy();
    }

    // TODO formally prove that this always results in a full mesh
    private processNewPeers = async (newPeers: string[]) => {
        newPeers.forEach(peerID => {

            if (!this.conns.get(peerID) && peerID != this.peer.id) {
                this.connect(peerID);
            }
        });
    }

    async broadcast(type: string, payload: any) {
        this.conns.forEach(conn => {
            this.send(conn.peer, `user:${type}`, payload);
        });
    }

    private async sendPeers(conn: DataConnection) {
        conn.send({ type: 'peers', payload: this.getPeers() })
    }

    getPeers(includeSelf = false) {
        let peers = Array.from(this.conns, ([_, conn]) => conn.peer);

        if (includeSelf) {
            peers.push(this.peer.id);
        }

        return peers.sort();
    }

    async connect(peerID: string) {
        let conn = this.peer.connect(peerID, {
            reliable: true
        });

        this.addConnEventHandlers(conn);
    }
}

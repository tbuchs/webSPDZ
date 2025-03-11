import Emittery from 'emittery';

import { MPCRuntimeBase } from "../runtimes/MPCRuntimeBase";
import { MPCEvents, PassThroughRuntimeEvents, Transport } from './events';

type options = {
    peerID?: string
    shimFilePath: string
    configFilePath: string
    env?: { [key: string]: string }
}

const wrapEvent = (runtime: MPCRuntimeBase, manager: MPCManager, event: keyof PassThroughRuntimeEvents) => {
    runtime.on(event, (data) => {
        manager.emit(`runtime:${event}`, data);
    })
}

// Emittery.isDebugEnabled = true;
// export class MPCManager extends EventEmitter<MPCEvents> {
export class MPCManager extends Emittery<MPCEvents> {
    transport: Transport;
    peerIDToPID: Map<string, number> = new Map<string, number>();
    pidToPeerID: Map<number, string> = new Map<number, string>();
    peersReady: Map<string, boolean> = new Map<string, boolean>();
    runtime: MPCRuntimeBase;
    running = false;
    runtimeFactory: () => MPCRuntimeBase;
    transportFactory: () => Transport;
    env: { [key: string]: string } = {}


    // constructor(peerID: string | null, env: any = {}, runtimeCreatorFn: RTCreator = () => new PyScriptInterpreter(this, "./py/shim.py", "./config.toml")) {
    // constructor(peerID: string | null, env: any = {}, runtimeCreatorFn: RTCreator = () => new PyScriptXWorker(this, "./py/shim.py", "./config.toml")) {
    // constructor(transportFactory: () => Transport, env: any = {}, runtimeFactory: RTCreator = () => new PyodideXWorker()) {
    constructor(transportFactory: () => Transport, runtimeFactory: () => MPCRuntimeBase, env: any = {}) {
        super();

        this.transport = this.newTransport(transportFactory);

        this.runtime = this.newRuntime(runtimeFactory)


        this.env = env;
    }

    newTransport(transportFactory: () => Transport): Transport {
        this.transportFactory = transportFactory;

        this.peerIDToPID = new Map<string, number>();
        this.peersReady = new Map<string, boolean>();
        this.pidToPeerID = new Map<number, string>();

        const transport = transportFactory();

        this.addTransportEvents(transport);

        return transport;
    }

    newRuntime(runtimeFactory: () => MPCRuntimeBase = this.runtimeFactory): MPCRuntimeBase {
        this.runtimeFactory = runtimeFactory;

        const runtime = runtimeFactory()

        this.addRuntimeEvents(runtime);

        return runtime;
    }

    private addTransportEvents(transport: Transport) {
        transport.on('ready', (peerID) => { this.emit('transport:ready', peerID); });
        transport.on('closed', () => { this.emit('transport:closed'); });
        transport.on('error', (err) => { this.emit('transport:error', err); });
        transport.on('conn:ready', (peerID: string) => { this.emit('transport:conn:ready', peerID); });
        transport.on('conn:disconnected', (peerID: string) => { this.emit('transport:conn:disconnected', peerID); });
        transport.on('conn:error', ({ peerID, err }) => { this.emit('transport:conn:error', { peerID, err }); });
        transport.on('conn:data', ({ peerID, data }) => {
            switch (data.type) {
                case 'mpyc:ready': this.processReadyMessage(peerID, data.payload); break;
                case 'mpyc:runtime': this.processRuntimeMessage(peerID, data.payload); break;
                default: this.emit(`transport:conn:data:custom`, { peerID, data });
            }
        });
    }


    private addRuntimeEvents(runtime: MPCRuntimeBase) {
        // ['ready', 'exec:started', 'exec:finished', 'error', 'message', 'messageerror', 'display', 'display:error', 'stats'].forEach((event: keyof PassThroughRuntimeEvents) => {
        ['exec:init', 'exec:done', 'error', 'messageerror', 'display', 'display:error', 'display:stats'].forEach((event: keyof PassThroughRuntimeEvents) => {
            wrapEvent(runtime, this, event)
        })

        runtime.on('ready', () => {
            this.emit('runtime:ready');
        })

        runtime.on('send', ({ type, pid, payload }) => {
            this.sendMPCMessage(type, pid, payload)
        })
    }

    public runMPC(code: string, filename: string, is_async: boolean = true) {
        this.running = true;
        let peers = this.transport.getPeers(true)
        let pid = peers.findIndex((p) => p === this.transport.id())

        for (let i = 0; i < peers.length; i++) {
            this.peerIDToPID.set(peers[i], i)
            this.pidToPeerID.set(i, peers[i])
        }

        this.peersReady.set(this.transport.id(), true);

        this.runtime.run_mpc({
            pid,
            filename,
            parties: peers,
            is_async: is_async,
            no_async: !is_async,
            code: code,
        })
    }


    public reset(transportFactory = this.transportFactory, runtimeFactory = this.runtimeFactory) {
        this.resetTransport(transportFactory);
        this.resetRuntime(runtimeFactory);
    }

    resetTransport(transportFactory = this.transportFactory) {
        console.log("resetting transport");
        this.transport.destroy();
        this.transport = this.newTransport(transportFactory);
    }

    resetRuntime(runtimeFactory = this.runtimeFactory) {
        console.log("resetting runtime");
        this.runtime.destroy();
        this.runtime = this.newRuntime(runtimeFactory)
        this.running = false;
    }

    sendMPCMessage(type: string, pid: number, message: any) {
        // console.warn(type, pid, message)
        let peerID = this.pidToPeerID.get(pid)!;
        // console.warn(`sendMPCMessage`, peerID, pid)

        this.transport.send(peerID, `mpyc:${type}`, message)
    }

    // Called from the PeerJS connection
    processReadyMessage = (peerID: string, message: string) => {
        this.peersReady.set(peerID, true);

        if (!this.running) {
            console.log("ignoring mpc ready message because we are not running")
            return;
        }
        let pid = this.peerIDToPID.get(peerID)!;
        this.runtime.processReadyMessage(pid, message)
    }

    // Called from the PeerJS connection 
    processRuntimeMessage = (peerID: string, message: any) => {
        if (!this.running) {
            console.log("ignoring mpc runtime message because we are not running")
            return;
        }
        let pid = this.peerIDToPID.get(peerID)!;
        this.runtime.processRuntimeMessage(pid, message)
    }

}


declare global {
    interface Worker {
        sync: any;
    }

    interface Window {
        wrap: any;
    }
}

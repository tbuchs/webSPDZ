'use strict';

import '../scss/style.scss';

import { MPCManager, PeerJSTransport, PyScriptWorkerRuntime } from '@mpyc-web/core/lib';
import * as app from './app';

const MPYC_WEB_PY_VERSION = "0.7.0"

let blobURL = (code: string) => {
    return URL.createObjectURL(
        new Blob([code], {
            type: "text/plain",
        }),
    )
}

// let pc = new RTCPeerConnection()
// let dc = pc.createDataChannel("test")
// let ww = new ZWorker()

// ww.postMessage([dc])
// ww.postMessage([dc], { transfer: [dc] })
// ww.postMessage([pc])

// let ww = XWorker(blobURL(`
//          import js
//          js.console.error("test")
//     `), { type: "pyodide", config: "./config.toml", async: true })

// ww.onmessage = (e) => {
//     console.log("onmessage", e)
//     ww.postMessage("test")
// }


function main() {
    app.ensureStorageSchema(18);
    let peerID = app.getTabState("myPeerID", app.tabID);


    document.title += ` - (${app.tabID})`

    // ww.onmessage = (e) => {
    //     console.log("onmessage", e)
    //     ww.postMessage("test")
    //     ww.postMessage("test")
    //     ww.postMessage("test")
    //     ww.postMessage("test")
    // }
    // console.log(ww)
    const transportFactory = () => {
        try {
            return new PeerJSTransport(peerID);
        } catch (err) {
            console.warn(err)
            return new PeerJSTransport();
        }
    }


    // const runtimeFactory = () => new PyScriptWorkerRuntime();
    const runtimeFactory = () => new PyScriptWorkerRuntime({
        config: {
            fetch: [{ from: "./py/", to_folder: "./", files: [`mpyc_web-${MPYC_WEB_PY_VERSION}-py3-none-any.whl`, "demo.py"] }],
            packages: [`emfs:./mpyc_web-${MPYC_WEB_PY_VERSION}-py3-none-any.whl`],
        }
    });
    // const runtimeFactory = () => new PyodideWorkerRuntime();
    // const runtimeFactory = (mpc: MPCManager) => new PyScriptInterpreter(mpc, "./py/mpycweb/shim/shim.py", "./config.toml", { COLUMNS: "110" });

    // let mpyc = new MPCManager(peerID, { COLUMNS: "110" }, () => { return new PyScriptInterpreter(this) });
    let mpyc = new MPCManager(transportFactory, runtimeFactory);

    new app.Controller(mpyc, {
        terminalSelector: '#terminal',
        editorSelector: '#editor',
        demoSelectSelector: 'select#select-demo',
        hostPeerIDInputSelector: 'input#hostPeerID',
        chatInputSelector: '#chatInput',
        myPeerIDSelector: '#myPeerID',
        peersDivSelector: '#knownPeers',
        copyPeerIDButtonSelector: 'button#copyPeerID',
        resetPeerIDButtonSelector: 'button#resetPeerID',
        runMPyCButtonSelector: 'button#startButton',
        stopMPyCButtonSelector: 'button#stopButton',
        connectToPeerButtonSelector: 'button#connect',
        sendMessageButtonSelector: '#sendMessageButton',
        clearTerminalButtonSelector: 'button#clearTerminal',
        qrGenBtnSelector: '#show-qr',
        qrScanInputSelector: '#qrCodeFileInput',
        qrScanBtnSelector: '#scanQRCodeButton',
        splitPanelSelectors: ['.split-panel-editor', '.terminal-split-pane'],
        toggleStatsSelector: "#toggleStatsEl",
        versionSelector: "#version",
    });
}
document.addEventListener('DOMContentLoaded', function () {
    // setTimeout(main, 1000);
    main();
}, false);


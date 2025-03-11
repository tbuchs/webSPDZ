import * as app from '.';

import { format } from "./format";

import { EditorView } from '@codemirror/view';
import { AnyData, MPCManager, PeerJSTransport } from '@mpyc-web/core/lib';
import { ControllerOptions } from './elements';

import { $, $$, debounce, getStorage, isMobile, safe, setStorage } from '../utils';

// import * as polyscript from "polyscript";
import { Tooltip } from 'bootstrap';
// import erudaFeatures from 'eruda-features';
import { makeSplitJS } from './split';
export class Controller {
    mpyc: MPCManager;

    editor: app.Editor;
    term: app.Term;
    demoSelect: HTMLSelectElement;
    hostPeerIDInput: HTMLInputElement;
    chatInput: HTMLInputElement;
    myPeerIDEl: HTMLInputElement;
    knownPeersEl: HTMLElement;
    resetPeerIDButton: HTMLButtonElement;
    runMPyCButton: HTMLButtonElement;
    stopMPyCButton: HTMLButtonElement;
    connectToPeerButton: HTMLButtonElement;
    sendMessageButton: HTMLButtonElement;
    clearTerminalButton: HTMLButtonElement;
    versionDiv: HTMLDivElement;
    toggleStatsEl: HTMLInputElement;
    qr: app.QRComponent
    opts: ControllerOptions;

    constructor(mpyc: MPCManager, opts: ControllerOptions) {
        this.mpyc = mpyc;
        this.opts = opts;

        this.demoSelect = $<HTMLSelectElement>(opts.demoSelectSelector);
        this.hostPeerIDInput = $<HTMLInputElement>(opts.hostPeerIDInputSelector);
        this.chatInput = $<HTMLInputElement>(opts.chatInputSelector);
        this.myPeerIDEl = $<HTMLInputElement>(opts.myPeerIDSelector);
        this.knownPeersEl = $(opts.peersDivSelector);
        this.resetPeerIDButton = $<HTMLButtonElement>(opts.resetPeerIDButtonSelector);
        this.runMPyCButton = $<HTMLButtonElement>(opts.runMPyCButtonSelector);
        this.stopMPyCButton = $<HTMLButtonElement>(opts.stopMPyCButtonSelector);
        this.connectToPeerButton = $<HTMLButtonElement>(opts.connectToPeerButtonSelector);
        this.sendMessageButton = $<HTMLButtonElement>(opts.sendMessageButtonSelector);
        this.clearTerminalButton = $<HTMLButtonElement>(opts.clearTerminalButtonSelector);
        this.toggleStatsEl = $<HTMLInputElement>(opts.toggleStatsSelector);
        this.versionDiv = $<HTMLDivElement>(opts.versionSelector);

        $$('[data-bs-toggle="tooltip"]').forEach(el => new Tooltip(el, { trigger: 'hover' }));

        this.qr = new app.QRComponent($<HTMLButtonElement>(opts.qrGenBtnSelector), $<HTMLButtonElement>(opts.qrScanBtnSelector), $<HTMLInputElement>(opts.qrScanInputSelector), () => this.mpyc.transport.id());
        this.qr.on('qr:scanned', (peerID: string) => {
            this.hostPeerIDInput.value = peerID;
            this.hostPeerIDInput.dispatchEvent(new Event('input'));
        })
        this.qr.on('qr:error', (err: Error) => {
            this.term.error(err.message);
        })

        this.term = new app.Term(opts.terminalSelector, mpyc);
        this.editor = new app.Editor(opts.editorSelector, this.demoSelect, mpyc);

        this.init(mpyc, opts);
    }

    init(mpyc: MPCManager, opts: ControllerOptions) {
        this.term.info(`Initializing ${format.green('PeerJS')}...`);
        this.term.info(`Initializing ${format.green(mpyc.runtime.type())} runtime...`);

        this.initHostPeerIDInput();
        this.hostPeerIDInput.addEventListener('input', this.handleHostPeerIDInputEvent);


        this.setupMPyCEvents(mpyc);
        this.setupButtonEvents(mpyc, opts);
        this.setupDemoSelector();

        makeSplitJS(opts.splitPanelSelectors)

        this.setupGlobals();
    }

    @debounce()
    handleHostPeerIDInputEvent() {
        try {
            const peerURL = new URL(this.hostPeerIDInput.value);
            let peerID = peerURL.searchParams.get('peer')

            if (peerID) {
                this.hostPeerIDInput.value = peerID;
            }
        } catch (e) {
        }
    }
    setupMPyCEvents(mpyc: MPCManager) {
        addEventListener("error", (e) => {
            console.error(e);
            this.term.error(e.message);
        });
        mpyc.on('transport:ready', async (peerID: string) => {
            peerID = safe(peerID);
            this.myPeerIDEl.value = peerID;
            if (this.hostPeerIDInput.value == "") {
                this.hostPeerIDInput.value = peerID;
                localStorage.hostPeerID = peerID;
            }

            app.setTabState('myPeerID', peerID);
            // this.term.warn(`tab should be locked ${app.getTabState('lock') == 'locked'}`);

            console.log('Peer ID: ' + peerID);
            this.term.success(`${format.green("PeerJS")} ready with ID: ${format.peerID(peerID)}`);
            this.updatePeersDiv();
        });
        mpyc.on('transport:closed', async () => { this.term.error('PeerJS closed.'); });
        mpyc.on('transport:error', async (err: Error) => {
            this.term.warn(`PeerJS failed: ${err.message}`);
            console.warn(`PeerJS failed: ${err.message}\n${err.stack}`);

            if (err.message === "Lost connection to server.") {
                setTimeout(() => {
                    this.mpyc.transport.reconnect();
                }, 1000);
            };
        });
        mpyc.on('transport:conn:ready', this.onPeerConnectedHook);
        mpyc.on('transport:conn:disconnected', this.onPeerDisconnectedHook);
        mpyc.on('transport:conn:error', this.onPeerConnectionErrorHook);
        mpyc.on('transport:conn:data:custom', this.processChatMessage);
        mpyc.on('runtime:error', async (err: ErrorEvent) => { this.term.error(err.error); });
        // mpyc.on('runtime:message',async  (e: MessageEvent) => { this.term.writeln(e.data); });
        mpyc.on('runtime:messageerror', async (err: MessageEvent) => { this.term.error(err.data); });
        mpyc.on('runtime:exec:done', async () => { this.updatePeersDiv(); });
        mpyc.on('runtime:exec:init', async () => { this.updatePeersDiv(); });
        mpyc.on('runtime:display', async (message: string) => { this.term.display(message); });
        mpyc.on('runtime:display:error', async (message: string) => { this.term.displayError(message) });
        mpyc.on('runtime:display:stats', async (stats: string) => {
            this.term.live(stats)
        });

        mpyc.on('runtime:ready', async () => {
            console.log(`${mpyc.runtime.type()} runtime ready.`)

            this.term.success(`${format.green(mpyc.runtime.type())} runtime ready.`);
            // setTimeout(this.pingWorker, 3000);
        });
        // mpyc.on('transport:conn:data:mpyc', async () => { this.updatePeersDiv(mpyc); });
    }


    setupButtonEvents(mpyc: MPCManager, opts: ControllerOptions) {
        if (isMobile) {
            try {
                this.setupEruda()
            } catch (e) {
                console.warn(e)
            }
        }

        this.resetPeerIDButton.addEventListener('click', async () => { app.deleteTabState("myPeerID"); this.term.writeln("Restarting PeerJS..."); mpyc.resetTransport(() => new PeerJSTransport()); });
        this.stopMPyCButton.addEventListener('click', async () => { this.term.writeln("Restarting PyScript runtime..."); mpyc.resetRuntime(); });
        this.runMPyCButton.addEventListener('click', async (ev) => { this.term.scrollToBottom(); mpyc.runMPC(this.editor.getCode(), this.demoSelect.value, ev.ctrlKey || ev.shiftKey); this.term.scrollToBottom(); });
        // this.runMPyCButton.addEventListener('click', async (ev) => { mpyc.runMPC(this.editor.getCode(), this.demoSelect.value, ev.ctrlKey || ev.shiftKey); });
        this.connectToPeerButton.addEventListener('click', async () => { localStorage.hostPeerID = this.hostPeerIDInput.value; mpyc.transport.connect(this.hostPeerIDInput.value) });
        this.sendMessageButton.addEventListener('click', async () => { this.sendChatMessage(); });
        this.clearTerminalButton.addEventListener('click', async () => { this.term.clear(); });
        this.setupStatsToggle()

        // CHAT
        this.chatInput.addEventListener('keypress', async (e: Event) => {
            let ev = e as KeyboardEvent;

            if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault();
                return this.sendChatMessage();
            }
        });

        new app.CopyButton(opts.myPeerIDSelector, opts.copyPeerIDButtonSelector);
    }
    setupStatsToggle() {
        this.toggleStatsEl.addEventListener('click', async () => {
            if (this.toggleStatsEl.checked) {
                setStorage('showStats', 'true');

                Tooltip.getInstance("#toggleStatsLabel")!.setContent({ '.tooltip-inner': "Disable runtime stats" })
                this.mpyc.runtime.showStats();
            } else {
                setStorage('showStats', 'false')
                Tooltip.getInstance("#toggleStatsLabel")!.setContent({ '.tooltip-inner': "Enable runtime stats" })

                this.mpyc.runtime.hideStats();
            }
        });

        const showStats = getStorage('showStats');
        this.toggleStatsEl.checked = showStats === 'true';
        this.toggleStatsEl.dispatchEvent(new Event('click'));
    }

    async setupEruda() {
        let eruda = (await import('eruda')).default;

        let el = document.createElement('div');
        document.body.prepend(el);
        eruda.init({
            container: el,
            autoScale: true,
            defaults: {
                theme: 'dark',
            },
            tool: ['console', 'elements', 'network', 'info', 'resources']
        });
        // eruda.add(erudaFeatures);
        eruda.position({ x: 0, y: 0 });
    }

    setupGlobals() {
        window.mpyc = this.mpyc;
        window.editor = this.editor;
        window.term = this.term;
        window.r = () => { this.mpyc.reset() };
        window.run = async () => this.mpyc.runMPC(this.editor.getCode(), this.demoSelect.value, false);
        window.runa = async () => this.mpyc.runMPC(this.editor.getCode(), this.demoSelect.value, true);
        // window.ps2 = polyscript;
        window.app = this;
    }

    onPeerConnectedHook = async (newPeerID: string) => {
        this.term.success(`Connected to: ${format.peerID(newPeerID)}`);
        this.updatePeersDiv();
    }

    async updatePeersDiv() {
        console.log("updating the peers div")
        this.knownPeersEl.innerHTML = "";
        this.mpyc.transport.getPeers(true).forEach((p, pid) => {
            let icon = `
        <span class="position-relative end-0">
            <i class='bi ${this.mpyc.peersReady.get(p) ? 'bi-play-fill' : 'bi-pause-fill'}'></i>
        </span>`
            this.knownPeersEl.innerHTML += `
        <li class="list-group-item ${p == this.mpyc.transport.id() ? '' : 'list-group-item-light'}"> 
            <span class="" style="user-select:none">${pid}: </span>
            <span class="d-inline-block text-truncate" style="vertical-align:top;max-width:80%;">${safe(p)}</span> 
            ${icon}
        </li>`;
        });
    }

    onPeerDisconnectedHook = async (disconnectedPeerID: string) => {
        this.term.error(`Disconnected from: ${format.peerID(disconnectedPeerID)}`);
        this.updatePeersDiv();
    }

    onPeerConnectionErrorHook = async ({ peerID, err }: { err: Error, peerID: string }) => {
        this.term.error(`Failed to connect to: ${format.peerID(peerID)}: ${err.message}`);
        this.updatePeersDiv();
    }

    setupDemoSelector() {
        const mql = window.matchMedia("(max-width: 1199px)")
        const resizeDemoSelector = (mqe: MediaQueryListEvent | MediaQueryList) => {
            if (mqe.matches) {
                $("#mpc-demos").hidden = true
                $("#connectedPartiesLabel").hidden = true
                this.demoSelect.size = 1;
                $("#connectedPartiesLocationMobile").insertAdjacentElement('beforeend', this.knownPeersEl)
                $("#demoSelectorLocation2").insertAdjacentElement('beforeend', this.demoSelect)
                $("#chatFooter").insertAdjacentElement('beforeend', $("#chatInputGroup"))
            } else {
                $("#mpc-demos").insertAdjacentElement('beforeend', this.demoSelect)
                $("#connectedPartiesLocationDesktop").insertAdjacentElement('beforeend', this.knownPeersEl)
                $("#mpc-demos").hidden = false
                $("#connectedPartiesLabel").hidden = false
                $("#chatSidebar").insertAdjacentElement('beforeend', $("#chatInputGroup"))
                this.demoSelect.size = window.innerHeight / (4 * 21)
            }
        }

        mql.addEventListener('change', resizeDemoSelector)
        resizeDemoSelector(mql);

        // window.addEventListener('resize', debounce(() => {
        //     resizeDemoSelector();
        // }, 100))

        this.demoSelect.addEventListener('change', async () => {
            localStorage.demoSelectorSelectedIndex = this.demoSelect.selectedIndex;
            sessionStorage.demoSelectorSelectedIndex = this.demoSelect.selectedIndex;
            this.updateDemoCode();
        });

        this.demoSelect.selectedIndex = parseInt(sessionStorage.demoSelectorSelectedIndex || localStorage.demoSelectorSelectedIndex || 1);
        this.updateDemoCode();
    }

    async updateDemoCode() {
        let demoCode = await app.fetchSelectedDemo(this.demoSelect);
        this.editor.updateCode(demoCode);
    }

    initHostPeerIDInput(): string {
        const urlParams = new URLSearchParams(window.location.search);
        const peer = urlParams.get('peer');
        var hostPeerID = peer || localStorage.hostPeerID;
        if (hostPeerID) {
            this.hostPeerIDInput.value = hostPeerID;
            localStorage.hostPeerID = hostPeerID;
        }

        return hostPeerID;
    }
    sendChatMessage() {
        let message = this.chatInput.value;
        this.chatInput.value = "";
        this.term.chatMe(message)
        this.mpyc.transport.broadcast('chat', message)
    }

    processChatMessage = async ({ peerID, data }: { peerID: string, data: AnyData }) => {
        if (data.type != 'user:chat') {
            console.warn("unknown message type", data)
            return;
        }

        this.term.chat(peerID, data.payload);
    }

}


declare global {
    interface Window {
        mpyc: MPCManager;
        r: any;
        app: Controller
        run: any;
        runa: any;
        term: app.Term;
        editor: EditorView;
        ps: any;
        ps2: any;
    }
    interface PerformanceEntry {
        type: string;
    }
}

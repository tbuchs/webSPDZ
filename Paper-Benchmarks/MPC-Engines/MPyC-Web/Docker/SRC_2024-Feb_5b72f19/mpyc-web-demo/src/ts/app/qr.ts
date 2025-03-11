import { Modal, Tooltip } from 'bootstrap';
import Emittery from 'emittery';
import { Html5QrcodeResult, Html5QrcodeSupportedFormats } from 'html5-qrcode/esm/core';
import { Html5Qrcode } from 'html5-qrcode/esm/html5-qrcode';
import qr from 'qrcode';
import { $, hasCameraFn, safe } from '../utils';
const QR_CANVAS_CLASS = "qr-canvas";
const QR_URL_SPAN_CLASS = "qr-url-span";
const CANVAS_SELECTOR = `canvas.${QR_CANVAS_CLASS}`;
const IMG_SELECTOR = `div.tooltip-inner>img.${QR_CANVAS_CLASS}`;
const QR_URL_SPAN_SELECTOR = `div.tooltip-inner>span.${QR_URL_SPAN_CLASS}`;
const TOOLTIP_SELECTOR = `div.tooltip-inner`;

export type QREvents = {
    'qr:scanned': string
    'qr:error': Error
};

export class QRComponent extends Emittery<QREvents>  {
    scanInput: HTMLInputElement;
    showBtn: HTMLButtonElement;
    showBtnTooltip: Tooltip;
    showBtnTooltipEl: HTMLElement;
    scanBtn: HTMLButtonElement;
    peerIDGetter: () => string;
    scanner: Html5Qrcode;
    scanModal: Modal;
    scanModalDiv: HTMLDivElement;
    closeScanModalBtn: HTMLButtonElement;
    canvas: HTMLCanvasElement;

    constructor(genBtn: HTMLButtonElement, scanBtn: HTMLButtonElement, scanInput: HTMLInputElement, peerIDGetter: () => string) {
        super()

        this.showBtn = genBtn;
        this.scanBtn = scanBtn;
        this.scanInput = scanInput;
        this.peerIDGetter = peerIDGetter;

        document.body.insertAdjacentHTML('beforeend', this.modalHTML)
        document.body.insertAdjacentHTML('beforeend', this.canvasHTML)
        this.canvas = $<HTMLCanvasElement>(CANVAS_SELECTOR)!;

        this.closeScanModalBtn = $<HTMLButtonElement>("#closeQRCodeScannerButton");
        this.scanModalDiv = $<HTMLDivElement>('#qrScannerModal');
        this.scanModal = new Modal(this.scanModalDiv);

        this.setupGenerator()
        this.setupScanner()
    }

    setupGenerator() {
        this.showBtnTooltip = new Tooltip(this.showBtn, {
            html: true,
            placement: "bottom",
            trigger: "click hover focus",
            allowList: { ...Tooltip.Default.allowList, span: ['style'], img: [] },
            title: `
            <img class="${QR_CANVAS_CLASS}"></img>
            <br />
            <span class="${QR_URL_SPAN_CLASS}" style='font-size: 10px !important;'></span>
        `,

            // <img class="${QR_CANVAS_CLASS}"></img>
            // <br />
        });

        this.showBtnTooltipEl = $<HTMLElement>(TOOLTIP_SELECTOR)!;

        this.showBtn.addEventListener('shown.bs.tooltip', () => {
            let peerID = this.peerIDGetter();

            let baseURL = new URL("./", window.location.href);
            let qrURL = `${baseURL}?peer=${peerID}`;
            let displayURL = `${baseURL}?peer=<br/>${peerID}`;

            qr.toDataURL(this.canvas, qrURL, { errorCorrectionLevel: "H" })
                .then(dataURL => {
                    $<HTMLImageElement>(IMG_SELECTOR)!.src = dataURL;
                    $(QR_URL_SPAN_SELECTOR)!.innerHTML = safe(displayURL);
                })
                .catch(err => {
                    // console.warn("Failed to show a QR code", err)
                    // this.emit('qr:error', err)
                })

        });

        document.addEventListener('click', (e) => {
            if (!this.showBtn.matches(":hover") && !$(TOOLTIP_SELECTOR)?.matches(":hover")) {
                this.showBtnTooltip.hide();
            }
        });

        // this.showBtn.disabled = !isClipboardAPIEnabled()
        this.showBtn.addEventListener("click", async () => {
            this.canvas.toBlob((blob) => {
                try {
                    navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                } catch (err) {
                    console.warn("Copying images to the clipboard is not supported in this browser - https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write#browser_compatibility");
                }
            });
        });
    }

    setupScanner = () => {
        this.scanner = new Html5Qrcode("qrScannerEl", { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
        this.scanModalDiv.addEventListener('hidden.bs.modal', async () => {
            if (this.scanner.isScanning) {
                this.scanner.stop()
            }
        });
        this.closeScanModalBtn.addEventListener('click', async () => { this.closeScanner() });

        this.scanInput.addEventListener("change", (e: Event) => {
            if (e == null || e.target == null) {
                return;
            }
            let target: HTMLInputElement = e.target as HTMLInputElement;
            if (target.files && target.files.length === 0) {
                return;
            }
            let fileList: FileList = target.files!;
            const file: File = fileList[0];

            this.scanner.scanFileV2(file, true)
                .then((html5qrcodeResult: Html5QrcodeResult) => {
                    this.emit('qr:scanned', html5qrcodeResult.decodedText)
                }).catch((err: Error) => {
                    this.emit('qr:error', err)
                })
        });

        this.scanBtn.addEventListener('click', async () => {
            if (!await hasCameraFn()) {
                this.scanInput.click()
                return;
            }

            const config = { fps: 10, qrbox: { width: 150, height: 150 } };
            const successCallback = (decodedText: string, result: Html5QrcodeResult) => {
                this.emit('qr:scanned', decodedText)
                this.closeScanner()
            };

            this.scanner.start({ facingMode: "environment" }, config, successCallback, undefined);
            this.scanModal.show()
        });

    }

    closeScanner() {
        this.scanner.stop();
        this.scanModal.hide();
    }

    canvasHTML = `
        <canvas hidden class="${QR_CANVAS_CLASS}"></canvas>
    `

    modalHTML = `
    <div class="modal fade" id="qrScannerModal" tabindex="-1" aria-labelledby="qrScannerModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-fullscreen-sm-down">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="qrScannerModalLabel">QR Code scanner</h1>
            <button type="button" id="closeQRCodeScannerButton" class="btn-close" data-bs-dismiss="modal"
              aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="qrScannerEl"></div>
          </div>
        </div>
      </div>
    </div>
    `
}

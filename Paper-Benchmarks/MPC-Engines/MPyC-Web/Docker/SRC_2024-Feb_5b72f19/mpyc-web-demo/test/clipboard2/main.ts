import qr from 'qrcode';
import { $ } from '../../src/ts/utils';
console.log(qr)
const DEFAULT_URL = "https://e-nikolov.github.io/mpyc-test/?peer=c814d8ce-f1a9-4767-ae18-fec8fc386180"

let imageBlob: Blob;
let canvas = $<HTMLCanvasElement>("#canvas")!;
let image = $<HTMLImageElement>("#image")!;
let image2 = $<HTMLImageElement>("#image2")!;
let copyBtn = $<HTMLButtonElement>('#copy');
let target = $<HTMLDivElement>('#target');

const getBlob = async (text: string) => {
  let code = qr.toDataURL(text, { errorCorrectionLevel: "H" })

  return await code

}

const makeQRCode = async (text: string) => {
  image.src = await qr.toDataURL(canvas, text, { errorCorrectionLevel: "H" });
}

const copyQRCode = async () => {

  // do copy
  SelectText(target);
}
interface ClipboardItem {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ClipboardItem/types) */
  readonly types: ReadonlyArray<string>;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ClipboardItem/getType) */
  getType(type: string): Promise<Blob>;
}

interface ClipboardItemOptions {
  presentationStyle?: PresentationStyle;
}

type PresentationStyle = "attachment" | "inline" | "unspecified";
declare var ClipboardItem: {
  prototype: ClipboardItem;
  new(items: Record<string, string | Blob | PromiseLike<string | Blob>>, options?: ClipboardItemOptions): ClipboardItem;
};

await makeQRCode(DEFAULT_URL)

function SelectText(element) {
  if (document.body.createTextRange) {
    var range = document.body.createTextRange();
    range.moveToElementText(element);
    range.select();
  } else if (window.getSelection) {
    var selection = window.getSelection()!;
    var range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
// qr.toDataURL(canvas, "google.com", { errorCorrectionLevel: "H" })
//   .then(dataURL => {
//     console.log("dataURL", dataURL)
//     canvas.toBlob((blob) => {
//       console.log("blob", blob)
//       // let blobURL = URL.createObjectURL(blob!)
//       let blobURL = canvas.toDataURL()
//       imageBlob = blob!;
//       console.log("blobURL", blobURL)
//       image.src = blobURL;
//     })
//   })
//   .catch(err => {
//     console.error(err)
//   })
const blob = await new Promise<Blob>((resolve) => canvas.toBlob((blob: Blob | null) => resolve(blob!)));
console.log("blob", blob)
copyBtn.addEventListener('click', () => {
  // document.execCommand("copy", true, "123")
  console.log("copy button clicked")
  document.execCommand('Copy');
  // copyQRCode()
});
window.addEventListener('copy', function (e: ClipboardEvent) {
  console.log("intercepting copy--------------------------", e.clipboardData)

  let f = new File([blob], "qr.png", { type: "image/png" })
  // e.clipboardData!.items.add("<b style='color: purple; font-size: 50px;'>asdf</b>", "text/html");
  e.clipboardData!.items.add(f);
  // e.clipboardData!.files = new FileList()

  console.log("text/plain", e.clipboardData!.getData("text/plain"))
  console.log("text/html", e.clipboardData!.getData("text/html"))
  console.log("image/png", e.clipboardData!.getData("image/png"))
  console.log("f1", f)
  console.log("size 1", f.size)
  console.log("files", e.clipboardData!.files)
  console.log("items", e.clipboardData!.items)
  console.log("kind", e.clipboardData!.items[0].kind)
  console.log("type", e.clipboardData!.items[0].type)
  // console.log(e.clipboardData!.setData("text/html", "<b style='color: purple; font-size: 50px;'>asdf</b>"))
  console.log(e.clipboardData!.setData)
  // navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
  // console.log(e.clipboardData!.setData("image/png", image.src))
  e.preventDefault();
})

// target.setAttribute("contenteditable", "");
document.addEventListener("paste", function (e) {
  console.log("intercepting paste--------------------------", e.clipboardData)

  console.log("image/png", e.clipboardData!.getData("image/png"))
  console.log("text/plain", e.clipboardData!.getData("text/plain"))
  console.log("text/html", e.clipboardData!.getData("text/html"))
  console.log("items[0]", e.clipboardData!.items[0])
  console.log("type", e.clipboardData!.items[0].type)
  console.log("kind", e.clipboardData!.items[0].kind)
  let f = e.clipboardData!.items[0].getAsFile()!

  console.log("f2", f)
  console.log("size 2", f.size)
  // console.log("paste", e.clipboardData?.items[0].getAsFile())
  // console.log("paste", await e.clipboardData?.items[0].getAsFile()?.arrayBuffer())
  console.log("paste", e.clipboardData)
})

// window.addEventListener('copy', async function (e: ClipboardEvent) {
//   // e.clipboardData!.setData('text/plain', 'asdf');
//   // e.clipboardData!.clearData('text/plain');
//   // e.clipboardData!.clearData();
//   // e.clipboardData!.items.clear()
//   // ev.clipboardData!.setData('text/plain', 'Hello, world!');
//   // e.clipboardData!.setData('image/png', canvas.toDataURL().);

//   e.clipboardData!.setData('text/plain', 'Hi, world!');
//   console.log(qr)
//   canvas.toBlob

//   let b = await getBlob("google.com")
//   // e.clipboardData!.setData('text/html', '<b style="color: red;">Hello, world!</b>');

//   let f = new File([imageBlob], "image.png", { type: "image/png" })
//   e.clipboardData!.items.add(f);
//   e.clipboardData!.clearData('text/plain');
//   console.log("intercepting copy--------------------------", e.clipboardData)
//   console.log("paste", e.clipboardData?.getData("image/png"))
//   console.log("paste", e.clipboardData?.getData("text/plain"))
//   console.log("paste", e.clipboardData?.getData("text/html"))
//   console.log("paste", e.clipboardData?.items[0])
//   console.log("paste", e.clipboardData?.items[0].kind)
//   console.log("paste", e.clipboardData?.items[0].type)
//   // console.log("paste", e.clipboardData?.items[0].getAsFile())
//   // console.log("paste", await e.clipboardData?.items[0].getAsFile()?.arrayBuffer())
//   console.log("paste", e.clipboardData)
//   // console.log("copy", e.clipboardData?.items[0].getAsFile())
//   // ev.clipboardData!.setData('text/html', '<b style="color: red;">Hello, world!</b>');
//   e.preventDefault();
// });


declare global {
  interface Window {
    dragstart_handler: any;
    dragover_handler: any;
    drop_handler: any;
  }
}

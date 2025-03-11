import FontFaceObserver from "fontfaceobserver";
import { Terminal } from "xterm";


export function loadWebFont(terminal: Terminal): Promise<unknown> {
    const fontFamily = terminal.options.fontFamily!;
    const regular = new FontFaceObserver(fontFamily).load(null, 5000);
    const bold = new FontFaceObserver(fontFamily, { weight: "bold" }).load(null, 5000);

    return Promise.all([regular, bold]).then(
        () => {
        },
        () => {
            terminal.options.fontFamily = "Courier";
        }
    );
};


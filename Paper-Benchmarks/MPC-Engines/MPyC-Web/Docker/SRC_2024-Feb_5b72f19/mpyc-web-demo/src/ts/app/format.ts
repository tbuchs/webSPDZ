import ansi from "ansi-colors";
ansi.enabled = true;

declare module Colors {
    function peerID(text: string): string;
    function grey50(text: string): string;
}

export const format: typeof ansi & typeof Colors = { ...ansi, peerID: ansi.redBright, grey50: (s: string) => `\x1b[0m\x1b[38;5;244m${s}` };

import { ITerminalAddon, Terminal } from 'xterm';
import './index.css';
export class HorizontalScrollAddon implements ITerminalAddon {
    private terminal: Terminal;
    private element?: HTMLElement;
    private core: any;
    private viewport: HTMLElement;

    activate(terminal: Terminal): void {
        this.terminal = terminal;
        this.terminal.element.parentElement.classList.add("xterm-wrapper")
        this.core = (terminal as any)._core;

        this.createElement();
    }

    createElement() {
        let screenWrapper = document.createElement('div')
        screenWrapper.classList.add('xterm-screen-wrapper')

        let screenElement = this.core.screenElement;
        screenElement.insertAdjacentElement('beforebegin', screenWrapper)
        screenWrapper.insertAdjacentElement('beforeend', screenElement)
    }

    dispose(): void {
        // ignore
    }
}

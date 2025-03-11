import { ITerminalAddon, Terminal } from 'xterm';
import './index.css';

export class ScrollDownHelperAddon implements ITerminalAddon {
    private terminal: Terminal;
    private scrollDownBtn?: HTMLElement;
    private core: any;
    private viewport: HTMLElement;
    public isScrolledDown = true;


    activate(terminal: Terminal): void {
        this.terminal = terminal;
        this.core = (terminal as any)._core;
        this.viewport = this.core.viewport._viewportElement;

        this.createElement();
    }

    // @debounce(500)
    handleScrollHelper(isScrolledDown: boolean) {
        // console.warn("handleScrollHelper", isScrolledDown)
        this.isScrolledDown = isScrolledDown;
        if (isScrolledDown) {
            this.hide();
        } else {
            this.show();
        }
    }

    createElement() {
        let scrollDownBtn = document.createElement('div');
        scrollDownBtn.classList.add("xterm-scroll-down-helper")
        let scrollDownBtnSpan = document.createElement('span')
        scrollDownBtn.appendChild(scrollDownBtnSpan)

        this.terminal.element.parentElement.insertAdjacentElement("afterend", scrollDownBtn);
        this.scrollDownBtn = scrollDownBtn;

        scrollDownBtn.addEventListener('click', () => {
            this.hide();
        });

        let scrollCheckerWrapper = document.createElement('div');
        scrollCheckerWrapper.classList.add('xterm-scroll-checker-wrapper');


        let scrollChecker = document.createElement('div');
        scrollChecker.classList.add('xterm-scroll-checker');
        scrollCheckerWrapper.appendChild(scrollChecker);


        this.core._viewportScrollArea.insertAdjacentElement('beforeend', scrollCheckerWrapper);

        const io = new IntersectionObserver(([{ isIntersecting }]) => {
            this.handleScrollHelper(isIntersecting);
        }, { threshold: 0 });

        io.observe(scrollChecker);
    }


    dispose(): void {
        // ignore
    }

    show(): void {
        // console.warn("showing, wasScrolledDown", this.isScrolledDown)
        if (!this.terminal || !this.terminal.element) {
            return;
        }
        if (this.scrollDownBtn && this.scrollDownBtn.style.visibility != 'visible') {
            this.scrollDownBtn.style.visibility = 'visible';
            return;
        }

    }
    hide(): void {
        this.terminal.scrollToBottom();
        if (this.scrollDownBtn && this.scrollDownBtn.style.visibility != 'hidden') {
            this.scrollDownBtn.style.visibility = 'hidden';
            // console.warn("hiding, wasScrolledDown", this.isScrolledDown)
        }
    }
}

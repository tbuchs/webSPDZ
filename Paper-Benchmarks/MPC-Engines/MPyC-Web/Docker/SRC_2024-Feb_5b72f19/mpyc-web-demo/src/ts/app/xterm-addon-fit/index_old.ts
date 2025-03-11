// /**
//  * Copyright (c) 2017 The xterm.js authors. All rights reserved.
//  * @license MIT
//  */

// import type { ITerminalAddon, Terminal } from 'xterm';

// interface ITerminalDimensions {
//     /**
//      * The number of rows in the terminal.
//      */
//     rows: number;

//     /**
//      * The number of columns in the terminal.
//      */
//     cols: number;
// }


// const MINIMUM_COLS = 2;
// const MINIMUM_ROWS = 1;

// export class FitAddon implements ITerminalAddon {
//     private _terminal: Terminal | undefined;

//     public activate(terminal: Terminal): void {
//         this._terminal = terminal;
//     }

//     public dispose(): void { }

//     // public fit(): void {
//     //     const dims = this.proposeDimensions();
//     //     if (!dims || !this._terminal || isNaN(dims.cols) || isNaN(dims.rows)) {
//     //         return;
//     //     }

//     //     // TODO: Remove reliance on private API
//     //     const core = (this._terminal as any)._core;

//     //     // Force a full render
//     //     if (this._terminal.rows !== dims.rows || this._terminal.cols !== dims.cols) {
//     //         core._renderService.clear();
//     //         this._terminal.resize(dims.cols, dims.rows);
//     //     }
//     // }
//     public fit(minimum_columns = 80): void {

//         const core = (this._terminal as any)._core;
//         const viewport = core.viewport;
//         const scrollArea = core.viewport._scrollArea;
//         const dims = core._renderService.dimensions;

//         if (!this._terminal['custom_fit_listener_attached']) {
//             this._terminal['custom_fit_listener_attached'] = true;
//             console.warn("this._terminal['viewport']", viewport)
//             viewport._viewportElement.addEventListener('scroll', e => {
//                 scrollArea.style.left = (-viewport._viewportElement.scrollLeft) + "px";
//                 console.warn("scrollElement", scrollArea)
//             });
//         }

//         const geometry = this.proposeDimensions();
//         geometry.cols = Math.max(geometry.cols, minimum_columns);
//         if (geometry) {
//             // Force a full render
//             if (this._terminal.rows !== geometry.rows || this._terminal.cols !== geometry.cols) {
//                 core._renderService.clear();

//                 // we don't want to size the buffer based on target width, we want
//                 // to use max characters width (if it's wider) -- this can happen if 
//                 // you resize without resetting. unfortunately these buffers are pre-
//                 // allocated.

//                 let max = geometry.cols; // if it's wider
//                 // this._terminal['buffers']._activeBuffer.lines.forEach(line => {
//                 this._terminal._buffer.active._buffer.lines._array.forEach(line => {
//                     console.log("line", max, line)
//                     max = Math.max(max, line.length);
//                 });

//                 console.log("max", max)

//                 let dimensions = core._renderService.dimensions;

//                 let cols = Math.max(geometry.cols, max);
//                 this._terminal.resize(cols, geometry.rows);

//                 console.warn("canvasWidth", dimensions, dimensions.css.canvas)

//                 viewport._scrollArea.style.width = dimensions.css.canvas.width + "px";

//             }
//         }
//     }

//     public __fit = () => {
//         const dims = this.proposeDimensions();
//         console.log("fitting terminal", dims);
//         if (!dims || !this || isNaN(dims.cols) || isNaN(dims.rows)) {
//             // console.log("no dims, returning")
//             return;
//         }

//         dims.rows = Math.max(dims.rows, 12);
//         // dims.rows = Math.max(dims.rows, this.rows);
//         // dims.cols = Math.max(dims.cols, 80);
//         dims.cols = Math.max(dims.cols, this._terminal.cols);

//         if (dims.cols == this._terminal.cols && dims.rows == this._terminal.rows) {
//             // console.log("unchanged, returning")
//             return;
//         }

//         const core = (this as any)._core;

//         console.log("resizing terminal to ", dims.cols, dims.rows);
//         core._renderService.clear();
//         this._terminal.resize(dims.cols, dims.rows);
//         this._terminal.refresh(0, this._terminal.rows - 1)
//         this._terminal.updateTermSizeEnv();
//     }
//     public proposeDimensions(): ITerminalDimensions | undefined {
//         if (!this._terminal) {
//             return null;
//         }

//         if (!this._terminal.element || !this._terminal.element.parentElement) {
//             return undefined;
//         }
//         const core = (this._terminal as any)._core;
//         const dims = core._renderService.dimensions;

//         console.log("core", core)

//         const parentElementStyle = window.getComputedStyle(this._terminal.element.parentElement);
//         const parentElementHeight = parseInt(parentElementStyle.getPropertyValue('height'));
//         const parentElementWidth = Math.max(0, parseInt(parentElementStyle.getPropertyValue('width')));
//         const elementStyle = window.getComputedStyle(this._terminal.element);
//         const elementPadding = {
//             top: parseInt(elementStyle.getPropertyValue('padding-top')),
//             bottom: parseInt(elementStyle.getPropertyValue('padding-bottom')),
//             right: parseInt(elementStyle.getPropertyValue('padding-right')),
//             left: parseInt(elementStyle.getPropertyValue('padding-left'))
//         };
//         const elementPaddingVer = elementPadding.top + elementPadding.bottom;
//         const elementPaddingHor = elementPadding.right + elementPadding.left;
//         //  const availableHeight = parentElementHeight - elementPaddingVer;

//         const availableHeight = parentElementHeight - elementPaddingVer - core.viewport.scrollBarWidth;
//         const availableWidth = parentElementWidth - elementPaddingHor - core.viewport.scrollBarWidth;
//         const geometry = {
//             cols: Math.floor(availableWidth / dims.css.cell.width),
//             rows: Math.floor(availableHeight / dims.css.cell.height)
//         };
//         console.log("availableWidth, availableHeight", availableWidth, availableHeight)
//         console.log("core._renderService.dimensions", core._renderService.dimensions)
//         console.log("core._renderService.dimensions.actualCellWidth", dims.css.cell.width)
//         console.log("geometry", geometry)

//         return geometry;
//     }

//     // public proposeDimensions(): ITerminalDimensions | undefined {
//     //     if (!this._terminal) {
//     //         return undefined;
//     //     }

//     //     if (!this._terminal.element || !this._terminal.element.parentElement) {
//     //         return undefined;
//     //     }

//     //     // TODO: Remove reliance on private API
//     //     const core = (this._terminal as any)._core;
//     //     const dims = core._renderService.dimensions;

//     //     if (dims.css.cell.width === 0 || dims.css.cell.height === 0) {
//     //         return undefined;
//     //     }

//     //     const scrollbarWidth = this._terminal.options.scrollback === 0 ?
//     //         0 : core.viewport.scrollBarWidth;

//     //     const parentElementStyle = window.getComputedStyle(this._terminal.element.parentElement);
//     //     const parentElementHeight = parseInt(parentElementStyle.getPropertyValue('height'));
//     //     const parentElementWidth = Math.max(0, parseInt(parentElementStyle.getPropertyValue('width')));
//     //     const elementStyle = window.getComputedStyle(this._terminal.element);
//     //     const elementPadding = {
//     //         top: parseInt(elementStyle.getPropertyValue('padding-top')),
//     //         bottom: parseInt(elementStyle.getPropertyValue('padding-bottom')),
//     //         right: parseInt(elementStyle.getPropertyValue('padding-right')),
//     //         left: parseInt(elementStyle.getPropertyValue('padding-left'))
//     //     };
//     //     const elementPaddingVer = elementPadding.top + elementPadding.bottom;
//     //     const elementPaddingHor = elementPadding.right + elementPadding.left;
//     //     const availableHeight = parentElementHeight - elementPaddingVer;
//     //     const availableWidth = parentElementWidth - elementPaddingHor - scrollbarWidth;
//     //     const geometry = {
//     //         cols: Math.max(MINIMUM_COLS, Math.floor(availableWidth / dims.css.cell.width)),
//     //         rows: Math.max(MINIMUM_ROWS, Math.floor(availableHeight / dims.css.cell.height))
//     //     };
//     //     return geometry;
//     // }
// }

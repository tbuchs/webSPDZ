export const $ = <T extends HTMLElement>(selector: string, root = document): T => root.querySelector<T>(selector)!;
export const $$ = <T extends HTMLElement>(selector: string, root = document): T[] => [...root.querySelectorAll<T>(selector)];

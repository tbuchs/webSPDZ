/// <reference types="vite/client" />
declare module "*.py";
declare module "*.whl";
declare module "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js" {
    export * from 'pyodide'
};
declare module "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.mjs" {
    export * from 'pyodide'
};
import { resolve } from 'path';
import { defineConfig } from 'vite';
import packageJson from "./package.json";

import dts from 'vite-plugin-dts';

const getPackageName = () => {
  return packageJson.name.replace("@", "").replace("/", "-");
};

const fileName = {
  es: `${getPackageName()}.mjs`,
  umd: `${getPackageName()}.umd.cjs`,
  iife: `${getPackageName()}.iife.js`,
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    base: "./",
    build: {
      sourcemap: true,
      minify: "terser",
      lib: {
        entry: resolve(__dirname, "lib/main.ts"),
        name: "mpycWeb",
        fileName: (format) => fileName[format],
        formats,
      },
    },
    cacheDir: ".vite",
    plugins: [
      dts({
        outDir: ['dist/types']
      }),
    ],
  }
})

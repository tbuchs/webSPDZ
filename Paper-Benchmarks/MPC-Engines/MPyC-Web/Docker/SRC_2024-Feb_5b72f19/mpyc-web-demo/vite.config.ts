import fs from 'fs';
import git from 'git-rev-sync';
import { glob } from 'glob';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

const hexLoader = {
  name: 'hex-loader',
  transform(code, id) {
    const [path, query] = id.split('?');
    if (query != 'raw-hex')
      return null;

    const data = fs.readFileSync(path);

    return data;
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')


  return {
    // optimizeDeps: {
    //   auto: true,
    //   exclude: [
    //     'mpyc-web-core'
    //   ],
    // },
    // lib: {
    //   entry: path.resolve(__dirname, "src/main.ts"),
    //   fileName: "main",
    //   formats: ["es"],
    // },
    resolve: {
      alias: {
        // "@core": "@mpyc-web/core/dev",
        // "@pyscript/core": "https://cdn.jsdelivr.net/npm/@pyscript/core@0.2.8/index.js",
        // '@pyscript/core': './node_modules/@pyscript/core/index.js',
      }
    },
    define: {
      "__BUILD_INFO__": { version: env.npm_package_version, dirty: git.isDirty(), deployment: env.APP_DEPLOYMENT, timestamp: Date.now(), time: new Date().toLocaleString("en-IE", { hour12: false }), revision: git.short("../") },
    },
    base: "./",
    css: {
      devSourcemap: true,
    },
    build: {
      sourcemap: true,
      outDir: "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      minify: "terser",
      target: 'ESNext',
      rollupOptions: {
        // external: ['@pyscript/core'],
        input: [
          resolve(__dirname, 'index.html'),
          ...glob.sync('bench/**/*.html').map((path) => resolve(__dirname, path)),
          ...glob.sync('test/**/*.html').map((path) => resolve(__dirname, path)),
        ],
        output: {
          manualChunks: {
            eruda: ['eruda'],
            xterm: ['xterm'],
            codemirror: ['codemirror'],
            html5QRcode: ['html5-qrcode'],
          },
        },
        treeshake: "recommended",
      }
    },
    cacheDir: ".vite",
    plugins: [
      // checker({ typescript: true }),


      // hexLoader,

      // tsconfigPaths(),
      // externalize({ externals: ["@pyscript/core", "polyscript"] }),
      // new PyodidePlugin(),
      // topLevelAwait({
      //   // The export name of top-level await promise for each chunk module
      //   promiseExportName: "__tla",
      //   // The function to generate import names of top-level await promise in each chunk module
      //   promiseImportName: i => `__tla_${i}`
      // }),
    ],
    server: {
      host: "0.0.0.0",
      port: 4001,
      https: !process.env.VITE_HTTPS ? false : {
        key: process.env.VITE_HTTPS_KEY,
        cert: process.env.VITE_HTTPS_CERT,
      },
      hmr: process.env.NO_HMR ? false : {
        overlay: false,
      },
      headers: {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        'Cross-Origin-Resource-Policy': 'cross-origin',
        "Accept-Ranges": "bytes"
      },
      watch: {

      },
      fs: {
        // allow: [
        //   // "mpyc-web/", // and your source files
        //   "/**/*.*", // and your source files
        //   "src", // and your source files
        //   "./src/**/*.woff2", // and your source files
        //   "/src/**/*.woff2", // and your source files
        //   "../mpyc-web-py", // and your source files
        // ],
      }
    }
  }
})

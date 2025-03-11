// eslint-disable-next-line @typescript-eslint/no-var-requires
import packageJSON from "./package.json"

const getPackageName = () => {
  return "mpyc-web-core";
};

const config = {
  entries: [
    {
      filePath: "./dist/types/main.d.ts",
      outFile: `./dist/${getPackageName()}.d.ts`,
      noCheck: true,
    },
  ],

};

module.exports = config;

#!/usr/bin/env bash

polyscript=polyscript

if [[ "$1" ]]; then
    polyscript=${polyscript}$1
fi

. ./scripts/patches.sh

polyscript_path=$(patch_dir $polyscript)

sed -i -e 's@"./package.json": "./package.json"@"./package.json": "./package.json",\n\t"./esm/": "./esm/"@g' $polyscript_path/package.json && echo "Patching polyscript_path/package.json"

echo Committing patched $polyscript

yarn patch-commit -s $polyscript_path

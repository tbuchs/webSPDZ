#!/usr/bin/env bash

pyscript=@pyscript/core

if [[ "$1" ]]; then
    pyscript=${pyscript}$1
fi

. ./scripts/patches.sh

# pyscript_path=$(patch_dir "polyscript")
pyscript_path=$(patch_dir $pyscript) || exit 1

function patch_pyscript_files() {
    cat $1 | grep "polyscript/esm" -q && echo "Patching $1" && sed -i -e 's@../node_modules/polyscript/esm@polyscript/esm@g' $1
}
export -f patch_pyscript_files

find $pyscript_path -type f -exec bash -c "patch_pyscript_files {}" \;

echo Committing patched $pyscript

yarn patch-commit -s $pyscript_path

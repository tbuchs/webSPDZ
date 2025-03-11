#!/usr/bin/env bash

function debug() {
    echo "$@" >&2
}

function patch_dir() {
    local dependency=$1
    echo $dependency >&2
    patch_path=$(yarn patch "$dependency" --json)
    if [[ $? -ne 0 ]]; then
        debug "$patch_path"
        debug
        debug "Failed to patch $dependency"
        exit 1
    fi
    patch_path=$(echo $patch_path | jq -r '.path')
    echo $patch_path

    echo "Patching $dependency in $patch_path" >&2
}

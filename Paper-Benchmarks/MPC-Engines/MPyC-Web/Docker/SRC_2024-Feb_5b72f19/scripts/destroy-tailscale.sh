#!/usr/bin/env bash

# delete all mpyc demo machines from tailscale
curl "https://api.tailscale.com/api/v2/tailnet/${TAILSCALE_TAILNET}/devices" -u "${TAILSCALE_API_KEY}:" |
  jq -c '.devices
          | map(select(
              .hostname | startswith("mpyc-demo--")
          )) | .[].id' |
  while read device_id; do
    device_id=$(printf "%s" $device_id | xargs)
    echo "object: $device_id"
    curl -X DELETE "https://api.tailscale.com/api/v2/device/$device_id" -u "${TAILSCALE_API_KEY}:" -v
  done

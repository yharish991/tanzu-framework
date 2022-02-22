#!/bin/bash

set -euo pipefail

# TODO: For local dev usage can we have a path that skips login if they are already auth'd?
docker login --username "${REGISTRY_USERNAME}" --password "${REGISTRY_PASSWORD}" "${REGISTRY_SERVER}"

docker buildx create --use --name=qemu --node=qemu0

cd "${PACKAGE_PATH}"
OCI_REGISTRY="${REGISTRY_URL}" IMG_VERSION_OVERRIDE="$(git rev-parse --short HEAD)" make docker-build-and-publish

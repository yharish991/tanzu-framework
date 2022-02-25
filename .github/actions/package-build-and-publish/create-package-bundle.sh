#!/bin/bash

set -euo pipefail

# TODO: For local dev usage can we have a path that skips login if they are already auth'd?
docker login --username "${REGISTRY_USERNAME}" --password "${REGISTRY_PASSWORD}" "${REGISTRY_SERVER}"

VERSION="$(git rev-parse --short HEAD)"

if [[ -z "${IMAGE_NAME}" ]]; then
    echo "IMAGE_NAME is required"
    exit 1
fi
if [[ -z "${REGISTRY_URL}" ]]; then
    echo "REGISTRY_URL is required"
    exit 1
fi

NEW_IMAGE="${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"

cat <<EOF > "${PACKAGE_PATH}/kbld-config.yaml"
apiVersion: kbld.k14s.io/v1alpha1
kind: Config
overrides:
- image: ${IMAGE_NAME}:latest
  newImage: ${NEW_IMAGE}
EOF

cd "${PACKAGE_PATH}"

mkdir -p .imgpkg
touch .imgpkg/images.yml

kbld -f ./kbld-config.yaml \
    -f ./bundle \
    --imgpkg-lock-output .imgpkg/images.yml

PACKAGE_BUNDLE="${REGISTRY_URL}/${IMAGE_NAME}-package:${VERSION}"

imgpkg push -b "${PACKAGE_BUNDLE}" -f .


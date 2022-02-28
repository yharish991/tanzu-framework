#!/bin/bash

cd myproject/"$COMPONENT_PATH"
docker login --username "$REGISTRY_USERNAME" --password "$REGISTRY_PASSWORD" "$REGISTRY_SERVER"
OCI_REGISTRY="$REGISTRY_SERVER" make docker-build-and-publish

# Copyright 2021 VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

#include ../common.mk

XDG_CONFIG_HOME := ${HOME}/.config
TANZU_PLUGIN_PUBLISH_PATH ?= $(XDG_CONFIG_HOME)/tanzu-plugins

IMG_DEFAULT_NAME := featuregates-controller-manager
IMG_DEFAULT_TAG := latest
IMG_DEFAULT_NAME_TAG := $(IMG_DEFAULT_NAME):$(IMG_DEFAULT_TAG)

IMG_VERSION_OVERRIDE ?= $(IMG_DEFAULT_TAG)

ifeq ($(strip $(OCI_REGISTRY)),)
	IMG ?= $(IMG_DEFAULT_NAME):$(IMG_VERSION_OVERRIDE)
else
	IMG ?= $(OCI_REGISTRY)/$(IMG_DEFAULT_NAME):$(IMG_VERSION_OVERRIDE)
endif

TOOLS_DIR := $(abspath hack/tools)
TOOLS_BIN_DIR := $(TOOLS_DIR)/bin

# Add tooling binaries here and in hack/tools/Makefile
CONTROLLER_GEN     := $(TOOLS_BIN_DIR)/controller-gen
GOLANGCI_LINT      := $(TOOLS_BIN_DIR)/golangci-lint
GOIMPORTS          := $(TOOLS_BIN_DIR)/goimports
GOBINDATA          := $(TOOLS_BIN_DIR)/gobindata
KUBEBUILDER        := $(TOOLS_BIN_DIR)/kubebuilder
KUSTOMIZE          := $(TOOLS_BIN_DIR)/kustomize
YTT                := $(TOOLS_BIN_DIR)/ytt
KBLD               := $(TOOLS_BIN_DIR)/kbld
VENDIR             := $(TOOLS_BIN_DIR)/vendir
IMGPKG             := $(TOOLS_BIN_DIR)/imgpkg
KAPP               := $(TOOLS_BIN_DIR)/kapp
KUBEVAL            := $(TOOLS_BIN_DIR)/kubeval
GINKGO             := $(TOOLS_BIN_DIR)/ginkgo
VALE               := $(TOOLS_BIN_DIR)/vale
YQ                 := $(TOOLS_BIN_DIR)/yq
CONVERSION_GEN     := $(TOOLS_BIN_DIR)/conversion-gen
TOOLING_BINARIES   := $(CONTROLLER_GEN) $(GOLANGCI_LINT) $(YTT) $(KBLD) $(VENDIR) $(IMGPKG) $(KAPP) $(KUBEVAL) $(KUSTOMIZE) $(GOIMPORTS) $(GOBINDATA) $(GINKGO) $(VALE) $(YQ) $(CONVERSION_GEN)

CRD_OPTIONS ?= "crd"

all: manager

# Run tests
test: fmt vet manifests
	go test ./... -coverprofile cover.out

# Build manager binary
manager: fmt vet
	go build -ldflags "$(LD_FLAGS)" -o bin/manager ../../../../cmd/managers/featuregate/main.go

# Run against the configured Kubernetes cluster in ~/.kube/config
run: fmt vet
	go run -ldflags "$(LD_FLAGS)" ../../../../cmd/managers/featuregate/main.go

# Run go fmt against code
fmt:
	go fmt ./...

# Run go vet against code
vet:
	go vet ./...

# Generate deployment manifest for the tkr manager
deployment: manifests
	cd config/manager && kustomize edit set image controller=${IMG}
	kustomize build config/default

manifests: controller-gen ## Generate manifests e.g. CRD, RBAC etc.
	$(CONTROLLER_GEN) $(CRD_OPTIONS) rbac:roleName=manager-role webhook paths="./..." output:crd:artifacts:config=./config/crd/bases

controller-gen: ## Download controller-gen
ifeq (, $(shell which controller-gen))
	@{ \
	set -e ;\
	CONTROLLER_GEN_TMP_DIR=$$(mktemp -d) ;\
	cd $$CONTROLLER_GEN_TMP_DIR ;\
	$(GO) mod init tmp ;\
	$(GO) get sigs.k8s.io/controller-tools/cmd/controller-gen@v0.2.5 ;\
	rm -rf $$CONTROLLER_GEN_TMP_DIR ;\
	}
CONTROLLER_GEN=$(GOBIN)/controller-gen
else
CONTROLLER_GEN=$(shell which controller-gen)
endif

tools: $(TOOLING_BINARIES) ## Build tooling binaries
.PHONY: $(TOOLING_BINARIES)
$(TOOLING_BINARIES):
	make -C $(TOOLS_DIR) $(@F)

.PHONY: local-registry
local-registry: ## Starts up a local docker registry. Local docker registry is used for pushing the package bundle to get the sha256, for using it later when producing repo bundle
	docker run -d -p 5001:5000 --name registry mirror.gcr.io/library/registry:2

.PHONY: docker-build
docker-build: ## Build docker image
	docker build -t $(IMG) -f Dockerfile --build-arg LD_FLAGS="$(LD_FLAGS)" .

.PHONY: docker-publish
docker-publish: ## Publish docker image
	docker push $(IMG)

.PHONY: docker-lint
docker-lint:
	docker build . -f Dockerfile --target lint

.PHONY: docker-test
docker-test:
	docker build . -f Dockerfile --target unit-test

.PHONY: package-bundle
package-bundle:
	docker build . -f Dockerfile --target packaging

.PHONY: kbld-image-replace
kbld-image-replace: ## Add newImage in kbld-config.yaml
	cd ../hack/packages/kbld-image-replace && $(MAKE) run IMAGE=$(IMG_DEFAULT_NAME_TAG) NEW_IMAGE=$(IMG)

.PHONY: docker-image-names
docker-image-names:
	@echo $(IMG)

.PHONY: docker-build-and-publish
docker-build-and-publish: docker-build docker-publish kbld-image-replace

.PHONY: build-plugin
build-plugin:
	$(GO) run ../cmd/cli/plugin-admin/builder/main.go cli compile --version $(BUILD_VERSION) --path ./cli

.PHONY: publish-plugin
publish-plugin:
	$(GO) run ../cmd/cli/plugin-admin/builder/main.go publish --type local --plugins feature --version $(BUILD_VERSION) --os-arch "${GOHOSTOS}-${GOHOSTARCH}" --local-output-discovery-dir "$(TANZU_PLUGIN_PUBLISH_PATH)/discovery/standalone" --local-output-distribution-dir "$(TANZU_PLUGIN_PUBLISH_PATH)/distribution" --input-artifact-dir ./artifacts
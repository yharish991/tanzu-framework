# Copyright 2021 VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

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

CRD_OPTIONS ?= "crd"

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

.PHONY: init
init:
	docker run --rm --entrypoint /bin/sh quay.io/hyayiv/build-tooling:latest -c "cat Dockerfile" > Dockerfile && \
	docker pull quay.io/hyayiv/packaging:latest

.PHONY: docker-all
docker-all: docker-build docker-publish kbld-image-replace ## Ship Docker images

.PHONY: docker-build
docker-build: ## Build docker image
	docker build -t $(IMG) -f Dockerfile --build-arg LD_FLAGS="$(LD_FLAGS)" --load .

.PHONY: docker-publish
docker-publish: ## Publish docker image
	docker push $(IMG)

.PHONY: lint
lint:
	docker build . -f Dockerfile --target lint

.PHONY: test
test: fmt vet manifests
	docker build . -f Dockerfile --target unit-test

.PHONY: kbld-image-replace
kbld-image-replace: ## Add newImage in kbld-config.yaml
	cd ../hack/packages/kbld-image-replace && \
      go run main.go -kbld-config ../../../featuregates/packages/featuregates/kbld-config.yaml $(IMG_DEFAULT_NAME_TAG) $(IMG)

.PHONY: package-bundle-generate
package-bundle-generate:
	@docker run \
	  -e OPERATIONS=package_bundle_generate \
	  -e PACKAGE_NAME=$(PACKAGE_NAME) \
	  -e THICK=true \
	  -e OCI_REGISTRY=$(OCI_REGISTRY) \
	  -e PACKAGE_VERSION=$(PACKAGE_VERSION) \
	  -e PACKAGE_SUB_VERSION=$(PACKAGE_SUB_VERSION) \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  -v $(PWD):/workspace \
		quay.io/hyayiv/packaging:latest

.PHONY: package-bundle-generate-all
package-bundle-generate-all:
	@docker run \
	  -e OPERATIONS=package_bundle_all_generate \
	  -e PACKAGE_REPOSITORY=$(PACKAGE_REPOSITORY) \
	  -e THICK=true \
	  -e OCI_REGISTRY=$(OCI_REGISTRY) \
	  -e PACKAGE_VERSION=$(PACKAGE_VERSION) \
	  -e PACKAGE_SUB_VERSION=$(PACKAGE_SUB_VERSION) \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  -v $(PWD):/workspace \
		quay.io/hyayiv/packaging:latest

.PHONY: package-bundle-push
package-bundle-push:
	@docker run \
	  -e OPERATIONS=package_bundle_push \
	  -e PACKAGE_NAME=$(PACKAGE_NAME) \
	  -e OCI_REGISTRY=$(OCI_REGISTRY) \
	  -e PACKAGE_VERSION=$(PACKAGE_VERSION) \
	  -e PACKAGE_SUB_VERSION=$(PACKAGE_SUB_VERSION) \
	  -e REGISTRY_USERNAME=$(REGISTRY_USERNAME) \
	  -e REGISTRY_PASSWORD=$(REGISTRY_PASSWORD) \
	  -e REGISTRY_SERVER=$(REGISTRY_SERVER) \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  -v $(PWD):/workspace \
		quay.io/hyayiv/packaging:latest

.PHONY: package-bundle-push-all
package-bundle-push-all:
	@docker run \
	  -e OPERATIONS=package_bundle_all_push \
	  -e PACKAGE_REPOSITORY=$(PACKAGE_REPOSITORY) \
	  -e OCI_REGISTRY=$(OCI_REGISTRY) \
	  -e PACKAGE_VERSION=$(PACKAGE_VERSION) \
	  -e PACKAGE_SUB_VERSION=$(PACKAGE_SUB_VERSION) \
	  -e REGISTRY_USERNAME=$(REGISTRY_USERNAME) \
	  -e REGISTRY_PASSWORD=$(REGISTRY_PASSWORD) \
	  -e REGISTRY_SERVER=$(REGISTRY_SERVER) \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  -v $(PWD):/workspace \
		quay.io/hyayiv/packaging:latest

.PHONY: repo-bundle-generate
repo-bundle-generate:
	@docker run \
	  -e OPERATIONS=repo_bundle_generate \
	  -e PACKAGE_REPOSITORY=$(PACKAGE_REPOSITORY) \
	  -e OCI_REGISTRY=$(OCI_REGISTRY) \
	  -e REPO_BUNDLE_VERSION=$(REPO_BUNDLE_VERSION) \
	  -e REPO_BUNDLE_SUB_VERSION=$(REPO_BUNDLE_SUB_VERSION) \
	  -e PACKAGE_VALUES_FILE=$(PACKAGE_VALUES_FILE) \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  -v $(PWD):/workspace \
		quay.io/hyayiv/packaging:latest

.PHONY: repo-bundle-push
repo-bundle-push:
	@docker run \
	  -e OPERATIONS=repo_bundle_push \
	  -e PACKAGE_REPOSITORY=$(PACKAGE_REPOSITORY) \
	  -e OCI_REGISTRY=$(OCI_REGISTRY) \
	  -e REPO_BUNDLE_VERSION=$(REPO_BUNDLE_VERSION) \
	  -e REPO_BUNDLE_SUB_VERSION=$(REPO_BUNDLE_SUB_VERSION) \
	  -e REGISTRY_USERNAME=$(REGISTRY_USERNAME) \
	  -e REGISTRY_PASSWORD=$(REGISTRY_PASSWORD) \
	  -e REGISTRY_SERVER=$(REGISTRY_SERVER) \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  -v $(PWD):/workspace \
		quay.io/hyayiv/packaging:latest

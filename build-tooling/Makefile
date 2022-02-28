include ../common.mk

COMPONENTS ?= pkg/v1/sdk/features addons cliplugins pkg/v2/tkr/webhook/infra-machine pkg/v1/sdk/capabilities
ROOT_DIR := $(shell git rev-parse --show-toplevel)

# iterate over the components and build the image and publish the image and replace the kbld

.PHONY: build
build:
	#docker build -t harishyayi/image-tooling -f images/Dockerfile .
	@ for component in $(COMPONENTS); do \
   		echo $$component \
#    	docker run harishyayi/image-tooling \
#    		-e COMPONENT_PATH='pkg/sdk/v1/capabilities' \
#    		-e REGISTRY_URL='docker.io/harishyayi' \
		echo "test" \
	done

#.PHONY: docker-build
#docker-build: ## Build docker image
#	@for plugin in pkg/v1/sdk/features addons cliplugins pkg/v2/tkr/webhook/infra-machine pkg/v1/sdk/capabilities ; do \
#		$(echo) $$plugin \
#	done

PHONY: docker-build
docker-build: ## Build docker image
	echo $$ROOT_DIR
#	docker build -t image-tooling:latest -f images/Dockerfile . --load
	@ for COMPONENT in $(COMPONENTS) ; do \
   		echo "test"; \
		docker run image-tooling:latest $$COMPONENT; \
	done
# Copyright 2021 VMware, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Build from publicly reachable source by default, but allow people to re-build images on
# top of their own trusted images.
ARG BUILDER_BASE_IMAGE=golang:1.17

FROM $BUILDER_BASE_IMAGE as base
ARG DIR
WORKDIR /workspace
# Copy the go source
COPY ./$DIR ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Linting
FROM base AS lint
RUN curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin v1.42.1
RUN golangci-lint run --timeout 20m0s ./...

# Unit testing
FROM base AS unit-test
RUN --mount=target=. \
    --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go test ./...

FROM base AS packaging
ENV DOCKER_CE_VERSION 5:20.10.14~3-0~ubuntu-eoan
ENV DOCKER_CE_CLI_VERSION 5:20.10.14~3-0~ubuntu-eoan
ENV CONTAINERD_VERSION 1.5.11-1
ENV GOVERSION 1.17.7
ENV PATH="${PATH}:/usr/local/go/bin"
RUN apt-get update && \
    apt-get install -y make git wget curl tar zip gnupg lsb-release ca-certificates

RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

RUN echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

RUN apt-get update && \
    apt-get install -y \
        docker-ce \
        docker-ce-cli \
        containerd.io && \
    rm -rf /var/lib/apt/lists/*

#RUN wget -q https://go.dev/dl/go${GOVERSION}.linux-amd64.tar.gz && \
#    tar -C /usr/local -xzf go${GOVERSION}.linux-amd64.tar.gz

#RUN curl -sSL https://get.docker.com/ | sh
RUN --mount=type=tmpfs,source=/var/run/docker.sock,target=/var/run/docker.sock

RUN docker run hello-world

RUN go install github.com/vmware-tanzu/tanzu-framework/hack/packages/package-tools
RUN make tools
RUN make local-registry
RUN package-tools package-bundle generate featuregates --thick --version=v0.0.1 --registry=quay.io/hyayiv

# Build the manager binary
FROM base as builder
ARG LD_FLAGS
ENV LD_FLAGS="$LD_FLAGS "'-extldflags "-static"'
RUN --mount=target=. \
    --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 GO111MODULE=on go build -o /out/manager ./main.go

# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=builder /out/manager .
USER nonroot:nonroot

ENTRYPOINT ["/manager"]


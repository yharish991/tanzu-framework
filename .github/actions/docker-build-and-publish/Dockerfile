FROM ubuntu:20.04

ENV GOVERSION 1.17.7
ENV PATH="${PATH}:/usr/local/go/bin"

RUN apt-get update && \
    apt-get install -y make git wget curl tar && \
    rm -rf /var/lib/apt/lists/*

RUN wget -q https://go.dev/dl/go${GOVERSION}.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go${GOVERSION}.linux-amd64.tar.gz

RUN curl -sSL https://get.docker.com/ | sh

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

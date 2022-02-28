FROM docker:dind

ENV GOVERSION 1.17.7
ENV PATH="${PATH}:/usr/local/go/bin"

RUN apk add --update make
RUN apk add --update git
RUN apk add --update wget

RUN wget -q https://go.dev/dl/go${GOVERSION}.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go${GOVERSION}.linux-amd64.tar.gz

RUN mkdir myproject
COPY ./ ./myproject

COPY build-tooling/images/build-and-publish.sh /build-and-publish.sh

ENTRYPOINT ["sh","/build-and-publish.sh"]

FROM golang:1.11.4

RUN apt-get update

RUN apt-get install -y jq curl git vim build-essential

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

RUN npm install yarn -g
RUN ls -la /root/.npm/

ENV GANACHE_URL="http://ganache:7545"
ENV GAMMA_URL="http://gamma:8080"

COPY voting/docker/bring-gamma.sh /tmp/bring-gamma.sh

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts

COPY voting/ ./voting/
COPY psilo/ ./psilo/

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts/voting/processor
RUN rm -f orbs-gamma-config.json && \
    mv orbs-gamma-config.docker.json orbs-gamma-config.json
RUN yarn

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts/voting/test/it
COPY voting/docker/entrypoint.sh .

RUN rm -f orbs-gamma-config.json && \
    rm -f truffle-config.js && \
    mv orbs-gamma-config.docker.json orbs-gamma-config.json && \
    mv truffle-config.docker.js truffle-config.js

RUN bash /tmp/bring-gamma.sh
RUN go get ./... && \
    yarn

CMD ["/bin/bash", "entrypoint.sh"]

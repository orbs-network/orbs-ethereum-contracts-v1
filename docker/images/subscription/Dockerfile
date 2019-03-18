FROM itamararjuan/go-node
ENV GAMMA_HOST="gamma"

COPY docker/images/subscription/bring-gamma.sh /tmp/bring-gamma.sh

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts/subscription

COPY subscription/ .

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts/subscription/ethereum
RUN npm install
RUN truffle compile

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts/subscription/test
COPY docker/images/subscription/entrypoint.sh .

RUN rm -f orbs-gamma-config.json && \
    rm -f truffle-config.js && \
    mv orbs-gamma-config.docker.json orbs-gamma-config.json && \
    mv truffle-config.docker.js truffle-config.js

RUN bash /tmp/bring-gamma.sh
RUN go get -t ./... && \
    npm install

CMD ["/bin/bash", "entrypoint.sh"]

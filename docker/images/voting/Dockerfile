FROM itamararjuan/go-node
ENV GAMMA_HOST="gamma"

COPY docker/images/voting/bring-gamma.sh /tmp/bring-gamma.sh

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts/voting

COPY voting/ .

# general mock contrats imported by tests
COPY orbs-solidity-mocks/ethereum/ ./orbs-solidity-mocks/ethereum/

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts/voting/processor
RUN rm -f orbs-gamma-config.json && \
    mv orbs-gamma-config.docker.json orbs-gamma-config.json
RUN npm install

WORKDIR /go/src/github.com/orbs-network/orbs-ethereum-contracts/voting/test/it
COPY docker/images/voting/entrypoint.sh .

RUN rm -f orbs-gamma-config.json && \
    rm -f truffle-config.js && \
    mv orbs-gamma-config.docker.json orbs-gamma-config.json && \
    mv truffle-config.docker.js truffle-config.js

RUN bash /tmp/bring-gamma.sh
RUN go get ./... && \
    npm install

CMD ["/bin/bash", "entrypoint.sh"]

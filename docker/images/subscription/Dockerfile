FROM itamararjuan/go-node
ENV GAMMA_HOST="gamma"

COPY docker/images/subscription/bring-gamma.sh /tmp/bring-gamma.sh

WORKDIR ./orbs-ethereum-contracts

COPY subscription/ ./subscription/

# general mock contrats imported by tests
COPY orbs-solidity-mocks/ethereum/ ./orbs-solidity-mocks/ethereum/

# required because subscription depends on IOrbsValidators
COPY voting/ethereum/ ./voting/ethereum/

WORKDIR ./subscription/ethereum
RUN npm install
RUN truffle compile

WORKDIR ../test
COPY docker/images/subscription/entrypoint.sh .

RUN rm -f orbs-gamma-config.json && \
    rm -f truffle-config.js && \
    mv orbs-gamma-config.docker.json orbs-gamma-config.json && \
    mv truffle-config.docker.js truffle-config.js

RUN bash /tmp/bring-gamma.sh
RUN go get -t ./... && \
    npm install

CMD ["/bin/bash", "entrypoint.sh"]

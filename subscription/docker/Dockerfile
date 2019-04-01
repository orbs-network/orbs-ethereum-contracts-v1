FROM golang:1.11.4

RUN apt-get update

RUN apt-get install -y jq curl git vim build-essential

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

RUN npm install yarn -g
RUN ls -la /root/.npm/
RUN npm install truffle -g


ENV GAMMA_HOST="gamma"

COPY subscription/docker/bring-gamma.sh /tmp/bring-gamma.sh

WORKDIR ./orbs-ethereum-contracts

COPY subscription/ ./subscription/

# required because subscription depends on IOrbsValidators
COPY voting/ethereum/ ./voting/ethereum/

WORKDIR ./subscription/ethereum
RUN npm install
RUN truffle compile

WORKDIR ../test
COPY subscription/docker/entrypoint.sh .

RUN rm -f orbs-gamma-config.json && \
    rm -f truffle-config.js && \
    mv orbs-gamma-config.docker.json orbs-gamma-config.json && \
    mv truffle-config.docker.js truffle-config.js

RUN bash /tmp/bring-gamma.sh
RUN go get -t ./... && \
    npm install

CMD ["/bin/bash", "entrypoint.sh"]
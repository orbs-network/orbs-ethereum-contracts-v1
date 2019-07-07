FROM golang:1.11.4

RUN apt-get update

RUN apt-get install -y jq curl git vim build-essential

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

RUN npm install yarn -g
RUN ls -la /root/.npm/

ENV GANACHE_URL="http://ganache:7545"
ENV GAMMA_URL="http://gamma:8080"

COPY subscription/docker/bring-gamma.sh /tmp/bring-gamma.sh

WORKDIR ./orbs-ethereum-contracts

COPY subscription/ ./subscription/
COPY psilo/ ./psilo/

# required because subscription depends on IOrbsValidators
COPY voting/ethereum/ ./voting/ethereum/

WORKDIR ./subscription/ethereum
RUN yarn
RUN ./node_modules/.bin/truffle compile

WORKDIR ../test
COPY subscription/docker/entrypoint.sh .

RUN rm -f orbs-gamma-config.json && \
    rm -f truffle-config.js && \
    mv orbs-gamma-config.docker.json orbs-gamma-config.json && \
    mv truffle-config.docker.js truffle-config.js

RUN bash /tmp/bring-gamma.sh
RUN go get -t ./... && \
    yarn install

CMD ["/bin/bash", "entrypoint.sh"]

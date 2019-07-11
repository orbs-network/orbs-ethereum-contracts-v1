FROM node:10-stretch

RUN apt-get update

RUN apt-get install -y jq curl git vim build-essential

RUN npm install yarn -g
RUN ls -la /root/.npm/

ENV GANACHE_URL="http://ganache:7545"
ENV GAMMA_URL="http://gamma:8080"

COPY voting/docker/bring-gamma.sh /tmp/bring-gamma.sh

WORKDIR /usr/src/orbs-ethereum-contracts

COPY voting/ ./voting/
COPY psilo/ ./psilo/

WORKDIR /usr/src/orbs-ethereum-contracts/voting/ethereum
RUN yarn && yarn compile

WORKDIR /usr/src/orbs-ethereum-contracts/voting/processor
RUN yarn

WORKDIR /usr/src/orbs-ethereum-contracts/voting/test/it
COPY voting/docker/entrypoint.sh .

RUN rm -f truffle-config.js && \
    mv truffle-config.docker.js truffle-config.js

RUN bash /tmp/bring-gamma.sh
RUN yarn

CMD ["/bin/bash", "entrypoint.sh"]

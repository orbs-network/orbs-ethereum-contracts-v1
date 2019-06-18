#!/bin/bash -xe
mkdir -p _out
npm install -g yarn
yarn install
yarn start-ganache &
sleep 5 # give ganache some time to start
yarn test


#!/usr/bin/env bash

cd ../../ethereum
npm install
./node_modules/.bin/truffle migrate --network e2e --reset
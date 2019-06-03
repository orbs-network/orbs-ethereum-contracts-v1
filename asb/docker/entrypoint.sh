#!/usr/bin/env bash

./node_modules/.bin/truffle compile
mkdir -p build/contracts
cp ../build/ethereum/*.json ./build/contracts

go test . -run TestFullFlowOnGanache -v -count 1
#!/usr/bin/env bash
./node_modules/.bin/truffle compile
mkdir -p build/contracts
cp ../../build/ethereum/*.json ./build/contracts

go test . -run TestFullFlow -v -count 1 -timeout 0

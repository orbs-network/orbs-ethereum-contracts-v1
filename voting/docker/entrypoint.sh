#!/usr/bin/env bash
truffle compile
mkdir -p build/contracts
cp ../../build/ethereum/*.json ./build/contracts

go test . -run TestFullFlowOnGanache -v -count 1
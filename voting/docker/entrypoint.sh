#!/usr/bin/env bash
truffle compile
cp ../../build/ethereum/*.json ./build/contracts

go test . -run TestFullFlowOnGanache -v -count 1
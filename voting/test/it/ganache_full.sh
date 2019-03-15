#!/usr/bin/env bash

if [ ! -f "./build/contracts/TestingERC20.json" ]; then
  truffle compile
fi

cp ../../build/ethereum/*.json ./build/contracts

gamma-cli stop-local
killall Ganache

nohup /Applications/Ganache.app/Contents/MacOS/Ganache&
gamma-cli start-local -wait -env experimental

go test . -run TestFullFlowOnGanache -v -count 1

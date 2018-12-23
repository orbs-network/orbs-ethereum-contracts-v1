#!/usr/bin/env bash

go get -u github.com/orbs-network/orbs-contract-sdk/...

./node_modules/.bin/truffle test ./test/*.sol ./test/contract-test/VerifierEndToEnd.js
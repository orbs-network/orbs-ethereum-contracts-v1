#!/usr/bin/env bash

node stripper.js ./build/contract/ ./federation/build/contracts/*.json
node stripper.js ./build/contract/ ./TestingERC20/build/contracts/TestingERC20.json

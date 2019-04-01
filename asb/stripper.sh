#!/usr/bin/env bash

node stripper.js ./build/contracts/ $1

# uncomment if you are doing this manully
#node stripper.js ./build/contracts/ ./ethereum/build/contracts/*.json


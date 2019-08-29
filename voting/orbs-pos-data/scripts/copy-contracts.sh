#!/usr/bin/env bash

rm -rf ./src/contracts
mkdir ./src/contracts
cp ../build/ethereum/* ./src/contracts
cp ../../rewards-distribution/ethereum/build/contracts/OrbsRewardsDistribution.json ./src/contracts
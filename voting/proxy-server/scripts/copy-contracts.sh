#!/usr/bin/env bash

rm -rf ./contracts
mkdir contracts
cp ../build/ethereum/* ./contracts
cp ../../rewards-distribution/ethereum/build/contracts/OrbsRewardsDistribution.json ./contracts
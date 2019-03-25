#!/usr/bin/env bash

export NETWORK_URL_ON_ETHEREUM=http://localhost:7545/
export ORBS_VOTING_CONTRACT_NAME="itamar_was_here"
export ERC20_CONTRACT_ADDRESS=0x5B31Ea29271Cc0De13E17b67a8f94Dd0b8F4B959
export VOTING_CONTRACT_ADDRESS=0x201e10E4Fa7f232F93c387928d3e453030e59166
export START_BLOCK_ON_ETHEREUM=500000
export END_BLOCK_ON_ETHEREUM=latest
export NETWORK_URL_ON_ORBS=1
export ORBS_ENVIRONMENT=local
export VERBOSE=1

cd voting/processor
node process.js
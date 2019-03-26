#!/usr/bin/env bash

export NETWORK_URL_ON_ETHEREUM="http://ec2-13-234-120-239.ap-south-1.compute.amazonaws.com:8545"
export ORBS_VOTING_CONTRACT_NAME="_Elections"
export ERC20_CONTRACT_ADDRESS="0xeD0Aa9A4F9e5ae9092994f4B86F6AAa89944939b" # Ropsten
export VOTING_CONTRACT_ADDRESS="0xF90a738CA659Fe99E357cB7F47Aaa5cB9b5724a2" #Ropsten
export START_BLOCK_ON_ETHEREUM=5270000
export END_BLOCK_ON_ETHEREUM=latest
export ORBS_ENVIRONMENT="ropstentest"
export VERBOSE=1

cd voting/processor
npm install
echo "**************** MIRRORING JOB STARTING **************"
node mirror.js
echo "**************** MIRRORING JOB FINISHED **************"

echo "**************** PROCESSING JOB STARTING **************"
node process.js
echo "**************** PROCESSING JOB FINISHED **************"

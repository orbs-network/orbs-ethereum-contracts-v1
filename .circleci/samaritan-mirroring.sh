#!/usr/bin/env bash

# I leave these as comments here for clarification on what is being passed through CircleCI
#export NETWORK_URL_ON_ETHEREUM="http://:8545"
#export ORBS_VOTING_CONTRACT_NAME="_Elections"
#export ERC20_CONTRACT_ADDRESS="0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA"
#export VOTING_CONTRACT_ADDRESS="0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d"
#export START_BLOCK_ON_ETHEREUM=7439509
export END_BLOCK_ON_ETHEREUM="latest"
#export ORBS_ENVIRONMENT="production"
export VERBOSE=1

cd voting/processor
echo "running npm install (buffered into npm.log)"
npm install &> npm.log

EXITCODE=$?

if [ $EXITCODE != 0 ]; then
    echo "npm install failed!"
    cat npm.log
    exit 1
fi

echo "**************** MIRRORING JOB STARTING **************"
node mirror.js
echo "**************** MIRRORING JOB FINISHED **************"

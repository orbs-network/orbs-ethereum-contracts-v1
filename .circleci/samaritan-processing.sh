#!/usr/bin/env bash

# I leave these as comments here for clarification on what is being passed through CircleCI
#export ORBS_URL="http://35.183.225.241/vchains/1100000"
#export ORBS_URL=1100000
#export ORBS_VOTING_CONTRACT_NAME="_Elections"
#export MAXIMUM_NUMBER_OF_TRIES=2500
#export BATCH_SIZE=10
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

echo "**************** PROCESSING JOB STARTING **************"
node process.js
echo "**************** PROCESSING JOB FINISHED **************"

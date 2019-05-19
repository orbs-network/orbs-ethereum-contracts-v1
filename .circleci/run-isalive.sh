#!/usr/bin/env bash

cd voting/processor
echo "running npm install (buffered into npm.log)"
npm install &> npm.log

EXITCODE=$?

if [ $EXITCODE != 0 ]; then
    echo "npm install failed!"
    cat npm.log
    exit 1
fi

node isalive.js

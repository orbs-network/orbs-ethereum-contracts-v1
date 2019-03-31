#!/bin/bash -xe
mkdir -p _out
npm install
npm run start-ganache &
sleep 5 # give ganache some time to start
npm test


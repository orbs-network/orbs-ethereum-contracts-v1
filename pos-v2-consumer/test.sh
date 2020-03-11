#!/bin/bash -xe
npm install
npm run start-ganache &
sleep 5 # give ganache some time to start
npm test
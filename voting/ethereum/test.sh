#!/bin/bash -xe
mkdir -p _out
#npm install
ganache-cli -p 7545 -i 5777 & > _out/ganache.log
sleep 5
truffle deploy
npm test


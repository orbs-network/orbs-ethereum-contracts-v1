#!/usr/bin/env bash

git clone https://github.com/MetaMask/metamask-extension
cd metamask-extension
nvm use
npm install
./node_modules/.bin/gulp build
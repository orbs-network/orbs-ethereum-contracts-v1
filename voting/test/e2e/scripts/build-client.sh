#!/usr/bin/env bash

rm -rf client-build
cd ../../client-web
nvm use system
npm install
npm run build
cd ../test/e2e
mkdir client-build
mkdir ./client-build/voting
cp -R ../../client-web/build/* ./client-build/voting/

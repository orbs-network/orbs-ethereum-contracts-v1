#!/usr/bin/env bash

git clone https://github.com/orbs-network/voting
cd voting/
git rm -rf *
cp -R ../build/* ./
git add .
git commit -m "deploy"
git push origin master
cd ..
rm -rf voting
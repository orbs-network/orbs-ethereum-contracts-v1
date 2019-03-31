#!/usr/bin/env bash

git clone https://github.com/orbs-network/voting-ko
cd voting-ko/
git rm -rf *
cp -R ../build/* ./
touch .nojekyll
git add .
git commit -m "deploy"
git push origin master
cd ..
rm -rf voting-ko
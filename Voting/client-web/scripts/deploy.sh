#!/usr/bin/env bash

npm run build
npm run export
git clone https://github.com/orbs-network/voting
cd voting/
git rm -rf *
mv ../out/* ./
touch .nojekyll
git add .
git commit -m "deploy"
git push origin master
cd ..
rm -rf voting
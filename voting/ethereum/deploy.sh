./node_modules/.bin/truffle compile

mkdir -p ../build/ethereum
rm -rf ../build/ethereum/*

node ../../stripper.js  ../build/ethereum/ build/contracts/*.json

truffle compile

mkdir -p ../build/ethereum
rm -rf ../build/ethereum/*

cp -vR build/contracts/* ../build/ethereum/.

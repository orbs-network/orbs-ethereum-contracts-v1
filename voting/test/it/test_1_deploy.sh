#!/usr/bin/env bash

if [ ! -f "./build/contracts/TestingERC20.json" ]; then
  truffle compile
fi

cp ../../build/ethereum/*.json ./build/contracts

gamma-cli stop-local
gamma_server_env="experimental"
[[ "$@" =~ "local" ]] && gamma_server_env="local"

## Uncomment to reset Ganache and Gamma on each invocation
#
#gamma-cli stop-local
#killall Ganache
#nohup /Applications/Ganache.app/Contents/MacOS/Ganache&

echo launching Gamma server env $gamma_server_env
gamma-cli start-local -wait -env $gamma_server_env


go test . -run TestDeploy -v -count 1 -timeout 0 $@


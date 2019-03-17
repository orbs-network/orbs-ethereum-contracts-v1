#!/usr/bin/env bash

if [ ! -f "./build/contracts/TestingERC20.json" ]; then
  truffle compile
fi

cp ../../build/ethereum/*.json ./build/contracts

today="$( date +"%Y%m%d" )"

number=0
suffix="$( printf -- '-%02d' "$number" )"

while [[ -f "logs/ropsten_full_output_$today$suffix.log" ]]
do
    (( ++number ))
    suffix="$( printf -- '-%02d' "$number" )"
done

fname="logs/ropsten_full_output_$today$suffix.log"

printf 'logging in file: %s\n' "$fname"

mkdir -p logs
time go test . -run TestFullOnRopsten -v -count 1 -timeout 0  2>&1 | tee $fname



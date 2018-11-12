#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT=${DIR}/../build/output

declare -a CONTRACTS=(
    "Federation"
    "SubscriptionManager"
)

mkdir -p ${OUTPUT}

for contract in "${CONTRACTS[@]}"
do
    ./node_modules/.bin/truffle-flattener ${DIR}/../contracts/${contract}.sol > ${OUTPUT}/${contract}.sol
done

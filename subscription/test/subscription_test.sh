#!/usr/bin/env bash
# Copyright 2019 the orbs-ethereum-contracts authors
# This file is part of the orbs-ethereum-contracts library in the Orbs project.
#
# This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
# The above notice should be included in all copies or substantial portions of the software.


gamma_server_env="experimental"
[[ "$@" =~ "local" ]] && gamma_server_env="local"

## Uncomment to reset Ganache and Gamma on each invocation
gamma-cli stop-local

echo launching Gamma server env $gamma_server_env
gamma-cli start-local -wait -env $gamma_server_env

go test . -run TestTransactionsFailWhenSubscriptionIsInvalid -v -count 1 -timeout 0 $@

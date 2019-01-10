#!/usr/bin/env bash

gamma-cli start-local -wait -env experimental
go test . -run TestDeployOnGanache -v -count 1

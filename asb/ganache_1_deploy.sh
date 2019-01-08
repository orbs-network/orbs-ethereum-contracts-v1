#!/usr/bin/env bash

gamma-cli start-local -wait
go test . -run TestDeployOnGanache -v -count 1

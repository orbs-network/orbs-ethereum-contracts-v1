#!/usr/bin/env bash

gamma-cli start-local -wait -env experimental
go test . -run TestFullFlowOnGanache -v -count 1

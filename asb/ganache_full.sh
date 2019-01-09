#!/usr/bin/env bash

gamma-cli start-local -wait
go test . -run TestFullFlowOnGanache -v -count 1

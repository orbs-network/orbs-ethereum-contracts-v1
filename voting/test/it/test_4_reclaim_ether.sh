#!/usr/bin/env bash

go test . -run TestReclaimGuardianDeposits -v -count 1 -timeout 0 $@


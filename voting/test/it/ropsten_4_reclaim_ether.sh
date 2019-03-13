#!/usr/bin/env bash

go test . -run TestReclaimGuardianDepositsOnRopsten -v -count 1 -timeout 30m


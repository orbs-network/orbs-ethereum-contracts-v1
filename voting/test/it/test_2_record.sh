#!/usr/bin/env bash

go test . -run TestRecord -v -count 1 -timeout 0 $@


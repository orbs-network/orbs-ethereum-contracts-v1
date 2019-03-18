#!/usr/bin/env bash

go test . -run TestMirrorAndProcess -v -count 1 -timeout 0 $@


#!/usr/bin/env bash

node scripts/fix-solidity-coverage.js
SOLIDITY_COVERAGE=true scripts/test.sh

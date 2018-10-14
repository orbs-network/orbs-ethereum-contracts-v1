#!/usr/bin/env bash -e

node scripts/fix-solidity-coverage.js
SOLIDITY_COVERAGE=true scripts/test.sh

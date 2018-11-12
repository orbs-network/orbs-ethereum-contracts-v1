#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function unify() {
	grep -v "^[pragma|import]" $DIR/$1 >> Unified.sol
}

echo "pragma solidity 0.4.24;" > Unified.sol

unify ../node_modules/openzeppelin-solidity/contracts/math/Math.sol
unify ../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol
unify ../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol
unify ../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol
unify ../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol
unify ../node_modules/openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol

unify ../contracts/DateTime.sol
unify ../contracts/Upgradable.sol
unify ../contracts/Federation.sol
unify ../contracts/SubscriptionManager.sol

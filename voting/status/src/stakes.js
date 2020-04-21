/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
"use strict";
const _ = require('lodash/core');

let verbose = false;
if (process.env.VERBOSE) {
    verbose = true;
}

function parseStake(web3, str) {
    let stakeBN = web3.utils.toBN(str);
    let mod10in16 = web3.utils.toBN('10000000000000000');
    let stakeStr = stakeBN.div(mod10in16);
    return parseFloat(stakeStr) / 100.0;
}

async function readOne(address, web3, tokenContract, stakingContract, stateBlock) {
    let stakeV1 = await tokenContract.methods.balanceOf(address).call({}, stateBlock).then(balanceStr => parseStake(web3, balanceStr));
    let stakeV2 = 0;
    if (stateBlock > 9831680) { // this is contract creation block
        stakeV2 = await stakingContract.methods.getStakeBalanceOf(address).call({}, stateBlock).then(balanceStr => parseStake(web3, balanceStr));
    }
    var stakeSum = stakeV1 + stakeV2;
    return stakeSum;
}

let stakePace = 250;
async function read(objectsMap, web3, tokenContract, stakingContract, stateBlock) {
    let objectList = _.values(objectsMap);
    for (let i = 0; i < objectList.length; i=i+stakePace) {
        let txs = [];
        if (verbose) {
            console.log('\x1b[33m%s\x1b[0m', `reading stakes, currently ${i} out of ${objectList.length}`);
        }
        for (let j = 0; j < stakePace && j+i< objectList.length; j++) {
            txs.push(readOne(objectList[i + j].address, web3, tokenContract, stakingContract, stateBlock).then(balance => {
                objectsMap[objectList[i + j].address.toLowerCase()].stake = balance;
            }));
        }
        await Promise.all(txs);
    }
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `finished reading stakes at block number ${stateBlock}`);
    }
}

module.exports = {
    read,
    readOne,
};

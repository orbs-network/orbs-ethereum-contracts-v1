/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
"use strict";
const fs = require('fs');
const _ = require('lodash/core');

let verbose = false;
if (process.env.VERBOSE) {
    verbose = true;
}

function mergeEvents(transferEvents, delegateEvents) {
    let mapper = {};
    for (let i = 0;i < transferEvents.length;i++) {
        mapper[transferEvents[i].address.toLowerCase()] = transferEvents[i];
    }

    for (let i = 0;i < delegateEvents.length;i++) {
        mapper[delegateEvents[i].address.toLowerCase()] = delegateEvents[i];
    }

    return mapper;
}

async function read(web3, tokenContract, votingContract, startBlock, endBlock, eventTxs) {
    let transferEvents = await require('./findDelegateByTransferEvents')(web3, tokenContract, startBlock, endBlock, 1000, eventTxs);
    if (verbose) {
        console.log(`Found ${transferEvents.length} Transfer events on Token Contract Address ${tokenContract.address}`);
    }

    let delegateEvents = await require('./findDelegateEvents')(votingContract, startBlock, endBlock, 20000, eventTxs);
    if (verbose) {
        console.log(`Found ${delegateEvents.length} Delegate events on Voting Contract Address ${votingContract.address}`);
    }

    let delegatorsMap = await mergeEvents(transferEvents, delegateEvents);
    console.log('\x1b[36m%s\x1b[0m', `Merged events into ${_.size(delegatorsMap)} delegators.`);
    return delegatorsMap
}

function update(accumulatedDelegatorsMap, delegatorsMap) {
    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegator = delegators[i];
        let delegatorAddr = delegator.address.toLowerCase();
        let shouldReplace = false;
        if (accumulatedDelegatorsMap[delegatorAddr]) {
            let currDel = accumulatedDelegatorsMap[delegatorAddr];
            if (currDel.method === 'Transfer' && delegator.method === 'Delegate' ) {
                shouldReplace = true;
//                console.log("new by method")
            } else if ( currDel.method === delegator.method &&
                ( (delegator.block > currDel.block) || (delegator.block === currDel.block && delegator.transactionIndex > currDel.transactionIndex))) {
                shouldReplace = true;
//               console.log("newer block")
            }
        } else {
//            console.log("new new")
            shouldReplace = true;
        }

        if (shouldReplace === true) {
            accumulatedDelegatorsMap[delegatorAddr] = delegator;
        }
    }
    console.log('\x1b[36m%s\x1b[0m', `Update events now we have ${_.size(accumulatedDelegatorsMap)} delegators.`);
}

async function writeToFile(delegatorsMap, filenamePrefix, currentElectionBlock) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `about to save ${_.size(delegatorsMap)} delegators information`);
    }
    let csvStr = `Delegator,Stake@${currentElectionBlock},Delegatee,Method,Block\n`;
    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegator = delegators[i];
        csvStr += `${delegator.address},${delegator.stake},${delegator.delegateeAddress},${delegator.method},${delegator.block}\n`;
        if (verbose) {
            console.log('%s \x1b[34m%s\x1b[0m %s \x1b[34m%s\x1b[0m %s \x1b[35m%s\x1b[0m %s \x1b[36m%s\x1b[0m %s \x1b[32m%s\x1b[0m',
                `Delegator`, `${delegator.address}`,
                `with stake`, `${delegator.stake}`,
                `delegated to`, `${delegator.delegateeAddress}`,
                `with a`, `${delegator.method}`,
                `at block`, `${delegator.block}`);
        }
    }

    let path = `${filenamePrefix}_${currentElectionBlock}_delegations.csv`;
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `Delegators information in CSV version file was saved to ${path}!\n`);
}

async function writeOneDelegationTxResults(list, typeStr, filenamePrefix, currentElectionBlock) {
    let csvStr = `Delegator,Block,TxIndex,TxHash,Method\n`;
    for (let i = 0; i < list.length; i++) {
        let obj = list[i];
        csvStr += `${obj.address},${obj.block},${obj.txIndex},${obj.txHash},${obj.method}\n`;
    }

    let path = `${filenamePrefix}_${currentElectionBlock}_${typeStr}.csv`;
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `Delegation ${typeStr} information saved to CSV file ${path}!`);
}

async function writeTxToFile(eventTxs, filenamePrefix, currentElectionBlock) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `about to save tx of delegations`);
    }
    let latestTransfers = _.values(eventTxs.onlyLatestTransfers);
    let latestDelegates = _.values(eventTxs.onlyLatestDelegates);
    await writeOneDelegationTxResults(eventTxs.totalTransfers, "TotalTransfers", filenamePrefix, currentElectionBlock);
    await writeOneDelegationTxResults(latestTransfers, "LatestTransfersOnly", filenamePrefix, currentElectionBlock);
    await writeOneDelegationTxResults(eventTxs.totalDelegates, "TotalDelegates", filenamePrefix, currentElectionBlock);
    await writeOneDelegationTxResults(latestDelegates, "LatestDelegatesOnly", filenamePrefix, currentElectionBlock);

    let latestMap = {};
    for(let i = 0; i < latestTransfers.length;i++) {
        let t = latestTransfers[i];
        latestMap[t.address] = t;
    }
    for(let i = 0; i < latestDelegates.length;i++) {
        let d = latestDelegates[i];
        latestMap[d.address] = d;
    }
    await writeOneDelegationTxResults(_.values(latestMap), "LatestCombined", filenamePrefix, currentElectionBlock);
    console.log('');
}

module.exports = {
    read,
    update,
    writeToFile,
    writeTxToFile,
};

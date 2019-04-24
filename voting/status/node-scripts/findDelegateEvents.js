/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

function generateTx(event) {
    return {txHash : event.transactionHash, block : event.blockNumber, txIndex : event.transactionIndex, address: getAddressFromTopic(event, TOPIC_FROM_ADDR)};
}

async function getAllPastDelegateEvents(votingContract, startBlock, endBlock, paging, verbose, eventTxs) {
    let mapOfTransfers = {};
    let listOfTransfers = [];
    try {
        for (let i = startBlock;i < endBlock;i += paging) {
            let actualEndBlock = i + paging < endBlock ? i + paging : endBlock
            let options = {
                fromBlock: i,
                toBlock: actualEndBlock
            };

            let events = await votingContract.getPastEvents('Delegate', options);
            if (verbose) {
                console.log('\x1b[33m%s\x1b[0m', `reading from block ${i} to block ${actualEndBlock} found ${events.length} delegate events`);
            }
            for (let i = events.length - 1; i >= 0; i--) {
                let event = events[i];
                eventTxs.totalDelegates.push(generateTx(event));
                let delegatorAddress = getAddressFromTopic(event, TOPIC_FROM_ADDR);
                let currentDelegateIndex = mapOfTransfers[delegatorAddress];
                if (typeof currentDelegateIndex === 'number' && isObjectNewerThanTx(listOfTransfers[currentDelegateIndex], event)) {
                    continue;
                }
                eventTxs.onlyLatestDelegates[delegatorAddress] = generateTx(event);
                let obj = generateDelegateObject(event.blockNumber, event.transactionIndex, event.transactionHash, delegatorAddress, getAddressFromTopic(event, TOPIC_TO_ADDR), event.event);

                if (typeof currentDelegateIndex === 'number') {
                    listOfTransfers[currentDelegateIndex] = obj;
                } else {
                    mapOfTransfers[delegatorAddress] = listOfTransfers.length;
                    listOfTransfers.push(obj);
                }
            }
        }
        return listOfTransfers;
    } catch (error) {
        console.log(error);
        return [];
    }
}

const TOPIC_FROM_ADDR = 1;
const TOPIC_TO_ADDR = 2;
function getAddressFromTopic(event, i) {
    let topic = event.raw.topics[i];
    return '0x' + topic.substring(26)
}

function isObjectNewerThanTx(latestDelegate, event) {
    return latestDelegate.block > event.blockNumber ||
        (latestDelegate.block > event.blockNumber && latestDelegate.transactionIndex > event.transactionIndex)
}

function generateDelegateObject(block, transactionIndex, txHash, address, delegateeAddress, method) {
    return {
        address, block, transactionIndex, txHash, delegateeAddress, method
    }
}

module.exports = getAllPastDelegateEvents;

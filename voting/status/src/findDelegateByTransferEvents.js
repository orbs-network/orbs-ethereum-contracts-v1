/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
let verbose = false;
if (process.env.VERBOSE) {
    verbose = true;
}

function generateTx(event) {
    return {txHash : event.transactionHash, block : event.blockNumber, txIndex : event.transactionIndex, address: getAddressFromTopic(event, TOPIC_FROM_ADDR), method: "Transfer"};
}

async function getTransferEvents(web3, tokenContract, options, mapOfTransfers, listOfTransfers, eventTxs) {
    let events = await tokenContract.getPastEvents('Transfer', options);
    let totals = {
        totalTransfers : events.length,
        totalDelegateTransfers : 0
    };
    for (let i = events.length - 1; i >= 0; i--) {
        let event = events[i];
        if (isTransferADelegateAction(event, web3)) { // its the right amount
            totals.totalDelegateTransfers++;
            let delegatorAddress = getAddressFromTopic(event, TOPIC_FROM_ADDR);//event.returnValues['0'];
            let currentDelegateIndex = mapOfTransfers[delegatorAddress];
            eventTxs.totalTransfers.push(generateTx(event));
            if (typeof currentDelegateIndex === 'number' && isObjectNewerThanTx(listOfTransfers[currentDelegateIndex], event)) {
                continue;
            }
            eventTxs.onlyLatestTransfers[delegatorAddress] = generateTx(event);
            let obj = generateDelegateObject(event.blockNumber, event.transactionIndex, event.transactionHash, delegatorAddress, getAddressFromTopic(event, TOPIC_TO_ADDR), event.event);

            if (typeof currentDelegateIndex === 'number') {
                listOfTransfers[currentDelegateIndex] = obj;
            } else {
                mapOfTransfers[delegatorAddress] = listOfTransfers.length;
                listOfTransfers.push(obj);
            }
        }
    }
    return totals;
}


async function getAllPastTransferEvents(web3, tokenContract, startBlock, endBlock, paging, eventTxs) {
    let mapOfTransfers = {};
    let listOfTransfers = [];
    let totalTransfers = 0, totalDelegateTransfers = 0;

    for (let i = startBlock;i < endBlock;i += paging) {
        let actualEndBlock = i + paging < endBlock ? i + paging : endBlock;
        let options = {
            fromBlock: i,
            toBlock: actualEndBlock
        };

        try {
            let currTotals = await getTransferEvents(web3, tokenContract, options, mapOfTransfers, listOfTransfers, eventTxs);
            totalTransfers += currTotals.totalTransfers;
            totalDelegateTransfers += currTotals.totalDelegateTransfers;
            if (verbose) {
                console.log('\x1b[33m%s\x1b[0m', `reading from block ${i} to block ${actualEndBlock} found ${currTotals.totalTransfers} token transfers`);
            }
        } catch (error) {
            console.log(error);
            if (verbose) {
                console.log('\x1b[31m%s\x1b[0m', `too many transfers, slowing down`);
            }
            for (let j = i; j < actualEndBlock; j += 100) {
                let options = {
                    fromBlock: j,
                    toBlock: j + 100
                };
                let currTotals = await getTransferEvents(web3, tokenContract, options, mapOfTransfers, listOfTransfers, eventTxs);
                totalTransfers += currTotals.totalTransfers;
                totalDelegateTransfers += currTotals.totalDelegateTransfers;
                if (verbose) {
                    console.log('\x1b[33m%s\x1b[0m', `reading from block ${j} to block ${j+100} found ${currTotals.totalTransfers} token transfers`);
                }
            }
        }
    }
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `read ${totalTransfers} token transfers of which ${totalDelegateTransfers} are delegation events of which ${listOfTransfers.length} are saved`);
    }
    return listOfTransfers;
}

function isTransferADelegateAction(event, web3) {
    return web3.utils.toBN(event.raw.data).eq(web3.utils.toBN('70000000000000000')); // 0.07 orbs
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
        address, block, transactionIndex, txHash, delegateeAddress, method, stake: 'n/a', participationReward : 0
    }
}

module.exports = getAllPastTransferEvents;

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const Web3 = require('web3');
const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

async function getAllPastTransferEvents(tokenContract, web3, startBlock, endBlock) {
    let options = {
        fromBlock: startBlock,
        toBlock: endBlock
    };

    let mapOfTransfers = {};
    let listOfTransfers = [];
    let events = await tokenContract.getPastEvents('Transfer', options);
    for (let i = events.length-1; i >= 0;i--) {
        let event = events[i];
         if (isTransferADelegateAction(event, web3)) { // its the right amount
            let delegatorAddress = getAddressFromTopic(event, TOPIC_FROM_ADDR);//event.returnValues['0'];
            let currentDelegateIndex = mapOfTransfers[delegatorAddress];
            if (typeof currentDelegateIndex === 'number' && isObjectNewerThanTx(listOfTransfers[currentDelegateIndex], event) ) {
                continue;
            }
            let obj = generateDelegateObject(event.blockNumber, event.transactionIndex, event.transactionHash, delegatorAddress, getAddressFromTopic(event, TOPIC_TO_ADDR), event.event);

            if(typeof currentDelegateIndex === 'number') {
                listOfTransfers[currentDelegateIndex] = obj;
            } else {
                mapOfTransfers[delegatorAddress] = listOfTransfers.length;
                listOfTransfers.push(obj);
            }
        }
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
        (latestDelegate.block === event.blockNumber && latestDelegate.transactionIndex > event.transactionIndex)
}

function generateDelegateObject(block, transactionIndex, txHash, delegatorAddress, delegateeAddress, method) {
    return {
        block, transactionIndex, txHash, delegatorAddress, delegateeAddress, method
    }
}

module.exports = async function (networkConnectionUrl, erc20ContractAddress, startBlock, endBlock) {
    let web3 = await new Web3(new Web3.providers.HttpProvider(networkConnectionUrl));
    let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);

    return await getAllPastTransferEvents(tokenContract, web3, startBlock, endBlock);
};

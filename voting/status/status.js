/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const Web3 = require('web3');
const fs = require('fs');
const _ = require('lodash/core');

let ethereumConnectionURL = process.env.ETHEREUM_NETWORK_URL_ON_ETHEREUM;
let erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
let votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
let startBlock = process.env.START_BLOCK_ON_ETHEREUM;
let endBlock = process.env.END_BLOCK_ON_ETHEREUM;
let filename = process.env.OUTPUT_FILENAME;
let verbose = false;
const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];


function validateInput() {
    if (process.env.VERBOSE) {
        verbose = true;
    }

    if (!ethereumConnectionURL) {
        throw("missing env variable ETHEREUM_NETWORK_URL_ON_ETHEREUM");
    }

    if (!erc20ContractAddress) {
        erc20ContractAddress = '0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA';
    }

    if (!votingContractAddress) {
        votingContractAddress = '0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d';
    }

    if (!startBlock) {
        startBlock = '7420000';
    }

    if (!endBlock) {
        endBlock = 'latest';
    }

    if (!filename) {
        filename = 'output.csv';
    }
}

function mergeEvents(transferEvents, delegateEvents) {
    let mapper = {};
    for (let i = 0;i < transferEvents.length;i++) {
        mapper[transferEvents[i].delegatorAddress] = transferEvents[i];
    }

    for (let i = 0;i < delegateEvents.length;i++) {
        mapper[delegateEvents[i].delegatorAddress] = delegateEvents[i];
    }

    return _.values(mapper);
}

async function readAndMergeEvents(web3, tokenContract, votingContractAddress, startBlock, endBlock) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `Reading from block ${startBlock} to block ${endBlock}`);
    }


    let transferEvents = await require('./node-scripts/findDelegateByTransferEvents')(web3, tokenContract, startBlock, endBlock);
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `Found ${transferEvents.length} Transfer events of Contract Address ${tokenContract.address}`);
    }

    let delegateEvents = await require('./node-scripts/findDelegateEvents')(web3, votingContractAddress, startBlock, endBlock);
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `Found ${delegateEvents.length} Delegate events of Contract Address ${votingContractAddress}`);
    }

    return mergeEvents(transferEvents, delegateEvents);
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `VERBOSE MODE`);
    }
    let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));
    let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);

    let results = await readAndMergeEvents(web3, tokenContract, votingContractAddress, startBlock, endBlock);
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `Merged to ${results.length} Delegate events`);
    }

    let csvStr = 'Delegator,Stake,Delegatee,Method,Block\n';

    for (let i = 0;i < results.length;i++) {
        let result = results[i];
        let stakeBN = web3.utils.toBN(await tokenContract.methods.balanceOf(result.delegatorAddress).call());
        let mod10in16 = web3.utils.toBN('10000000000000000');
        let stakeStr = stakeBN.div(mod10in16);
        result.stake = parseFloat(stakeStr) / 100.0;

        console.log('%s \x1b[34m%s\x1b[0m %s \x1b[34m%s\x1b[0m %s \x1b[35m%s\x1b[0m %s \x1b[36m%s\x1b[0m %s \x1b[32m%s\x1b[0m',
            `Delegator`, `${result.delegatorAddress}`,
            `with stake`, `${result.stake}`,
            `delegated to`, `${result.delegateeAddress}`,
            `with a`, `${result.method}`,
            `at block`, `${result.block}`);
        csvStr += `${result.delegatorAddress},${result.stake},${result.delegateeAddress},${result.method},${result.block}\n`;
    }

    fs.writeFileSync(filename, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `CSV version file was saved to ${filename}!`);
}

main()
    .then(results => {
        console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);

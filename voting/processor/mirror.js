/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const ethereumConnectionURL = process.env.NETWORK_URL_ON_ETHEREUM;
const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
const startBlock = process.env.START_BLOCK_ON_ETHEREUM;
const endBlock = process.env.END_BLOCK_ON_ETHEREUM;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;
let orbsEnvironment = process.env.ORBS_ENVIRONMENT;
let verbose = false;
let force = process.env.FORCE_RUN;
let paceGamma = 1;
let paceEthereum = 10000;

const gamma = require('./gamma-calls');

function validateInput() {
    if (process.env.VERBOSE) {
        verbose = true;
    }

    if (!ethereumConnectionURL) {
        throw("missing env variable NETWORK_URL_ON_ETHEREUM");
    }

    if (!erc20ContractAddress) {
        throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!votingContractAddress) {
        throw("missing env variable VOTING_CONTRACT_ADDRESS");
    }

    if (!orbsVotingContractName) {
        throw("missing env variable ORBS_VOTING_CONTRACT_NAME");
    }

    if (!orbsEnvironment) {
        console.log('No ORBS environment found using default value "local"\n');
        orbsEnvironment = "local";
    }
}

async function transferEvents(ethereumConnectionURL, erc20ContractAddress, startBlock, endBlock) {

    let transferEvents = await require('./node-scripts/findDelegateByTransferEvents')(ethereumConnectionURL, erc20ContractAddress, startBlock, endBlock);
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `Found ${transferEvents.length} Transfer events:\n`);
    }

    for (let i = 0;i < transferEvents.length;i=i+paceGamma) {
        try {
            let txs = [];
            for (let j = 0;j < paceGamma && i+j < transferEvents.length;j++) {
                if (verbose) {
                    console.log('\x1b[32m%s\x1b[0m', `Transfer event ${i + j + 1}:\n`, transferEvents[i+j]);
                }
                txs.push(gamma.sendTransaction('mirror-transfer.json', [transferEvents[i+j].txHash], orbsVotingContractName, orbsEnvironment));
            }
            await Promise.all(txs);
        } catch (e){
            console.log(`Could not mirror transfer event. Error OUTPUT:\n` + e);
        }
    }
}

async function delegateEvents(ethereumConnectionURL, votingContractAddress, startBlock, endBlock) {
    let delegateEvents = await require('./node-scripts/findDelegateEvents')(ethereumConnectionURL, votingContractAddress, startBlock, endBlock);
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `Found ${delegateEvents.length} Delegate events:\n`);
    }

    for (let i = 0;i < delegateEvents.length;i=i+paceGamma) {
        try {
            let txs = [];
            for (let j = 0;j < paceGamma && i+j < delegateEvents.length;j++) {
                if (verbose) {
                    console.log('\x1b[32m%s\x1b[0m', `Delegation event ${i + j + 1}:\n`, delegateEvents[i+j]);
                }
                txs.push(gamma.sendTransaction('mirror-delegate.json', [delegateEvents[i+j].txHash], orbsVotingContractName, orbsEnvironment));
            }
            await Promise.all(txs)
        } catch (e){
            console.log(`Could not mirror delegation event. Error OUTPUT:\n` + e);
        }
    }
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE\n`);
    }

    if (force) {
        console.log('\x1b[36m%s\x1b[0m', `Running special mirror for longer runs\n`);
        let actualStartBlock = 7440000;
        let actualEndBlock = await gamma.getCurrentBlockNumber(orbsVotingContractName, orbsEnvironment);
        for (let i = actualStartBlock;i < actualEndBlock;i=i+paceEthereum) {
            console.log('\x1b[36m%s\x1b[0m', `\nBetween blocks ${i}-${i+paceEthereum} \n`);
            await transferEvents(ethereumConnectionURL, erc20ContractAddress, i, i+paceEthereum);
            await delegateEvents(ethereumConnectionURL, votingContractAddress, i, i+paceEthereum);
        }
    } else {
        let actualStartBlock = 0;
        let actualEndBlock = 0;
        if (!startBlock) {
            actualEndBlock = await gamma.getCurrentBlockNumber(orbsVotingContractName, orbsEnvironment);
            actualStartBlock = actualEndBlock - 300;
        } else {
            actualStartBlock = startBlock;
            actualEndBlock = endBlock;
        }

        console.log('\x1b[36m%s\x1b[0m', `\nRunning mirror between blocks ${actualStartBlock}-${actualEndBlock}\n`);
        await transferEvents(ethereumConnectionURL, erc20ContractAddress, actualStartBlock, actualEndBlock);
        await delegateEvents(ethereumConnectionURL, votingContractAddress, actualStartBlock, actualEndBlock);
    }
}

main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);

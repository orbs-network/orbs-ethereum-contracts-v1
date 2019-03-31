/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

let orbsEnvironment = process.env.ORBS_ENVIRONMENT;
let verbose = false;
let maxNumberOfProcess  = process.env.MAXIMUM_NUMBER_OF_TRIES;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;

const gamma = require('./gamma-calls');

function validateInput() {
    if (!orbsEnvironment) {
        console.log('No ORBS environment found using default value "local"\n');
        orbsEnvironment = "local";
    }

    if (!orbsVotingContractName) {
        throw("missing env variable ORBS_VOTING_CONTRACT_NAME");
    }

    if (!maxNumberOfProcess || maxNumberOfProcess === 0 || maxNumberOfProcess === "0") {
        maxNumberOfProcess = -1;
    }

    if (process.env.VERBOUSE) {
        verbose = true;
    }

}

async function processCall() {
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nStarted Processing...`);
    }

    let isDone = 0;
    let numberOfCalls = 0;
    do {
        let result = await gamma.sendTransaction('process-voting.json', [], orbsVotingContractName, orbsEnvironment);
        isDone = result.OutputArguments[0].Value === "1" ? 1 : 0;

        if (verbose && numberOfCalls !== 0 && (numberOfCalls % 10) === 0) {
            console.log(`still processing ... `);
        }

        numberOfCalls++;
        if (maxNumberOfProcess !== -1 && maxNumberOfProcess <= numberOfCalls) {
            throw new Error(`problem processing votes did not finish after ${numberOfCalls} tries.`);
        }
    } while (isDone === 0);

    if (verbose) {
        console.log(`Processing was called ${numberOfCalls} times.`);
    }

}

async function getProcessingStartBlockNumber() {
    let blockNumber = 0;
    try {
        let result = await gamma.runQuery('get-processing-start-block.json', orbsVotingContractName, orbsEnvironment);
        blockNumber = parseInt(result.OutputArguments[0].Value)
    } catch (e){
        console.log(`Could not get processing start block number. Error OUTPUT:\n` + e);
    }
    return blockNumber;
}

async function isProcessingAllowed() {
    let currentBlockNumber = await gamma.getCurrentBlockNumber(orbsVotingContractName, orbsEnvironment);
    let processStartBlockNumber = await getProcessingStartBlockNumber();

    if (currentBlockNumber >= processStartBlockNumber) {
        return true;
    } else {
        console.log('\x1b[36m%s\x1b[0m', `\n\nCurrent block number: ${currentBlockNumber} is before process vote starting block number: ${processStartBlockNumber}.
         Processing is not needed please try again later!!\n`);
        return false;
    }
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE`);
    }

    isAllowed = await isProcessingAllowed();
    if (isAllowed) {
        await processCall();
    }
}

main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);

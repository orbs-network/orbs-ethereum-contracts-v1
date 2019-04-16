/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

let orbsEnvironment = process.env.ORBS_ENVIRONMENT;
let verbose = false;
let maxNumberOfProcess = 2;//process.env.MAXIMUM_NUMBER_OF_TRIES;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;
const batchSize = 3;

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

const CONTINUE = 0, DONE = 1, ERRORS = 2, PENDINGS = 3;
let numErrors = 0;
const maxErrors = 10;
let numPendings = 0;
const maxPendings = 25;
async function processResult(result) {
    console.log(result);
    if (result.RequestStatus === "COMPLETED") {
        if(result.ExecutionResult === "SUCCESS") {
            let isDone = result.OutputArguments[0].Value === "1" ? 1 : 0;
            if (isDone) {
                console.log('\x1b[36m%s\x1b[0m', `process return with "complete" ...`);
            }
            return isDone ? DONE : CONTINUE;
        } else {
            console.log('\x1b[36m%s\x1b[0m', `process return with normal error for "not the right time for process" ...`);
            return DONE;
        }
    } else if (result.RequestStatus === "IN_PROCESS" && result.ExecutionResult === "NOT_EXECUTED" && result.TransactionStatus === "PENDING") {
        numPendings++;
        if (numPendings >= maxPendings) {
            console.log('\x1b[31m%s\x1b[0m', `too many pendings quitting ...\n`);
        }
        return numPendings >= maxPendings ? PENDINGS : CONTINUE;
    } else {
        numErrors++;
        if (numErrors >= maxErrors) {
            console.log('\x1b[31m%s\x1b[0m', `too many errors quitting ...\n`);
        }
        return numErrors >= maxErrors ? ERRORS : CONTINUE;
    }
}

async function processResults(results) {
    let state = CONTINUE;
    for(let i = 0;i < results.length;i++) {
        state = await processResult(results[i])
        if (state !== CONTINUE){
            break;
        }
    }
    return state;
}

async function processCall() {
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nStarted Processing...`);
    }

    let processInfo = {};
    let numberOfCalls = 0;
    do {
        let start = Date.now();
        if (verbose) {
            console.log(`send batch of ${batchSize} calls... `);
        }
        let txs = [];
        for(let i = 0;i < batchSize;i++) {
            txs.push(gamma.sendTransaction('process-voting.json', [], orbsVotingContractName, orbsEnvironment));
        }
        let results = await Promise.all(txs);
        numberOfCalls += batchSize;

        if (await processResults(results) !== CONTINUE){
            break;
        }

        if (verbose) {
            console.log(`checking state of process... (took ${(Date.now() - start) / 1000.0} seconds)`);
        }

        if (maxNumberOfProcess !== -1 && maxNumberOfProcess <= numberOfCalls) {
            throw new Error(`problem processing votes: did not finish after ${numberOfCalls} tries.`);
        }
        processInfo = await getProcessingInfo();
    } while (processInfo.isProcessingPeriod);

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

async function getProcessingInfo() {
    let currentBlockNumber = await gamma.getCurrentBlockNumber(orbsVotingContractName, orbsEnvironment);
    let processStartBlockNumber = await getProcessingStartBlockNumber();

    return { isProcessingPeriod : currentBlockNumber >= processStartBlockNumber, currentBlockNumber,  processStartBlockNumber} ;
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE`);
    }

    let processInfo = await getProcessingInfo();
    if (processInfo.isProcessingPeriod) {
        await processCall();
    } else {
        console.log('\x1b[36m%s\x1b[0m', `\n\nCurrent block number: ${processInfo.currentBlockNumber} is before process vote starting block number: ${processInfo.processStartBlockNumber}.
         Processing is not needed please try again later!!\n`);
    }
}

main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);

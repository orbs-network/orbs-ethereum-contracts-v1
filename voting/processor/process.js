/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;
let orbsEnvironment = process.env.ORBS_ENVIRONMENT;
let verbose = false;
let maxNumberOfProcess = 10000;
let batchSize = 10;

const gamma = require('./src/gamma-calls');
const slack = require('./src/slack');

function validateInput() {
    if (!orbsEnvironment) {
        console.log('No ORBS environment found using default value "local"\n');
        orbsEnvironment = "local";
    }

    if (!orbsVotingContractName) {
        throw("missing env variable ORBS_VOTING_CONTRACT_NAME");
    }

    if (process.env.VERBOSE) {
        verbose = true;
    }

    if (process.env.MAXIMUM_NUMBER_OF_TRIES) {
        maxNumberOfProcess = parseInt(process.env.MAXIMUM_NUMBER_OF_TRIES);
    }
    if (!maxNumberOfProcess || maxNumberOfProcess === 0 || maxNumberOfProcess === "0") {
        maxNumberOfProcess = -1;
    }

    if (process.env.BATCH_SIZE) {
        batchSize = parseInt(process.env.BATCH_SIZE);
    }
}

const CONTINUE = 0, DONE = 1;
let numErrors = 0;
const maxErrors = 10;
let numPendings = 0;
const maxPendings = 25;

async function processResult(result) {
    if (result.RequestStatus === "COMPLETED") {
        if (result.ExecutionResult === "SUCCESS") {
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
            const msg = `too many pendings quitting`;
            console.log('\x1b[31m%s\x1b[0m', `${msg} ...\n`);
            await slack.sendSlack('Warning: Process has finished because too many pending responses for gamma calls, check Validators Network!');
            throw new Error(msg)
        }
        return CONTINUE;
    } else {
        numErrors++;
        if (numErrors >= maxErrors) {
            await slack.sendSlack('Warning: Process has finished because too many error responses for gamma calls, check Validators Network!');
            const msg = `too many errors quitting`;
            console.log('\x1b[31m%s\x1b[0m', `${msg} ...\n`);
            throw new Error(msg)
        }
        return CONTINUE;
    }
}

async function processResults(results) {
    let state = CONTINUE;
    for (let i = 0; i < results.length; i++) {
        state = await processResult(results[i]);
        if (state !== CONTINUE) {
            break;
        }
    }
    return state;
}

async function processCall() {
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nStarted Processing...`);
    }

    let isDone = false;
    let processInfo = {};
    let numberOfCalls = 0;
    do {
        let start = Date.now();
        if (verbose) {
            console.log('\x1b[36m%s\x1b[0m', `send batch of ${batchSize} calls... `);
        }
        let txs = [];
        for (let i = 0; i < batchSize; i++) {
            txs.push(gamma.sendTransaction(orbsEnvironment, orbsVotingContractName, 'process-voting.json', []));
        }
        let results = await Promise.all(txs);
        numberOfCalls += batchSize;

        if (await processResults(results) !== CONTINUE) {
            isDone = true;
            break;
        }

        if (verbose) {
            console.log('\x1b[36m%s\x1b[0m', `checking state of process... (took ${(Date.now() - start) / 1000.0} seconds)`);
        }

        if (maxNumberOfProcess !== -1 && maxNumberOfProcess <= numberOfCalls) {
            console.log('\x1b[31m%s\x1b[0m', `note processing votes: did not finish after ${numberOfCalls} tries.`);
            break;
        }
        processInfo = await getProcessingInfo();
    } while (processInfo.isProcessingPeriod);

    if (isDone) {
        await sendSuccessSlack();
    }

    if (verbose) {
        console.log(`Processing was called ${numberOfCalls} times.`);
    }
}

async function getProcessingInfo() {
    let currentBlockNumber = await gamma.getCurrentBlockNumber(orbsEnvironment, orbsVotingContractName);
    let processStartBlockNumber = await gamma.getProcessingStartBlockNumber(orbsEnvironment, orbsVotingContractName);

    return {
        isProcessingPeriod: currentBlockNumber >= processStartBlockNumber,
        currentBlockNumber,
        processStartBlockNumber
    };
}

function parseElected(electedStr) {
    let elected = [];
    for(let i = 2; i < electedStr.length;i+=40) {
        elected.push(electedStr.substr(i, 40));
    }
    return elected;
}

async function sendSuccessSlack() {
    let election = await gamma.runQueryParseNumberResult(orbsEnvironment, orbsVotingContractName, "get-election-number.json");
    let text = `Hurrah: :trophy: Election ${election} has finished!\n`;
        let query = [
        gamma.runQueryParseNumberResult(orbsEnvironment, orbsVotingContractName, "get-total-vote.json"),
        gamma.runQueryParseStringResult(orbsEnvironment, orbsVotingContractName, "get-elected.json", [election]),
        gamma.runQueryParseStringResult(orbsEnvironment, orbsVotingContractName, "get-elected.json", [election-1])
    ];
    let results = await Promise.all(query);

    let totalVote = results[0];
    text += `Total Voting Weight: ${totalVote.toLocaleString()}\n`;
    let electedNow = parseElected(results[1]);
    text += `Number of elected validators: ${electedNow.length}\n`;
    let electedBefore = parseElected(results[2]);

    let newElected = [];
    for (let i = 0;i < electedNow.length;i++) {
        if(results[2].indexOf(electedNow[i]) === -1) {
            newElected.push('0x'+electedNow[i]);
        }
    }
    if (newElected.length !== 0) {
        text += `Validators(Ethereum Address) newly added: ${newElected}\n`;
    }

    let votedOutElected = [];
    for (let i = 0;i < electedBefore.length;i++) {
        if(results[1].indexOf(electedBefore[i]) === -1) {
            votedOutElected.push('0x'+electedBefore[i]);
        }
    }
    if (votedOutElected.length !== 0) {
        text += `Validators(Ethereum Address) voted out: ${votedOutElected}\n`;
    }

    query = [];
    for (let i = 0;i < electedNow.length;i++) {
        query.push(gamma.runQueryParseNumberResult(orbsEnvironment, orbsVotingContractName, "get-validator-stake.json", [electedNow[i]]))
    }
    let validatorStakes = await Promise.all(query);
    let minValidatorStake = validatorStakes[0];
    let minValidatorAddress = electedNow[0];
    let totalValidatorStake = 0;
    for (let i = 0;i < validatorStakes.length;i++) {
        totalValidatorStake += validatorStakes[i];
        if (validatorStakes[i] < minValidatorStake) {
            minValidatorStake = validatorStakes[i];
            minValidatorAddress = electedNow[i];
        }
    }
    text += `Total Validators stake: ${totalValidatorStake.toLocaleString()}\nValidator(Ethereum Address) 0x${minValidatorAddress} has minimum stake: ${minValidatorStake.toLocaleString()}`;

    await slack.sendSlack(text);
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
    .then(() => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(e => {
    slack.sendSlack(`Warning: process failed with message '${e.message}', check Jenkins!`).finally(() => {
            console.error(e);
            process.exit(-4);
        }
    );
});

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const orbsUrl = process.env.ORBS_URL;
const orbsVchain = process.env.ORBS_VCHAINID;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;

let verbose = false;
let maxNumberOfProcess = 10000;
let batchSize = 10;

const slack = require('./src/slack');
const _ = require('lodash');

function validateInput() {
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

let numErrors = 0;
const maxErrors = 10;
let numPendings = 0;
const maxPendings = 25;

async function processResults(orbs, results) {
    for (let i = 0; i < results.length; i++) {
        switch (results[i]) {
            case orbs.ProcessDone:
                return orbs.ProcessDone;
            case orbs.ProcessError:
                numErrors++;
                break;
            case orbs.ProcessPending:
                numPendings++;
                break;
        }
    }
    if (numErrors >= maxErrors) {
        await slack.sendSlack('Warning: Process has finished because too many error responses for gamma calls, check Validators Network!');
        const msg = `too many errors quitting`;
        console.log('\x1b[31m%s\x1b[0m', `${msg} ...\n`);
        throw new Error(msg)
    }
    if (numPendings >= maxPendings) {
        await slack.sendSlack('Warning: Process has finished because too many pending responses for gamma calls, check Validators Network!');
        const msg = `too many pendings quitting`;
        console.log('\x1b[31m%s\x1b[0m', `${msg} ...\n`);
        throw new Error(msg)
    }
    return orbs.ProcessContinue;
}

async function processCall(orbs) {
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nStarted Processing...`);
    }

    let isDone = false;
    let numberOfCalls = 0;
    do {
        let start = Date.now();
        if (verbose) {
            console.log('\x1b[36m%s\x1b[0m', `send batch of ${batchSize} calls... `);
        }
        let txs = [];
        for (let i = 0; i < batchSize; i++) {
            txs.push(orbs.processVote());
        }
        let results = await Promise.all(txs);
        numberOfCalls += batchSize;

        if (verbose) {
            console.log('\x1b[36m%s\x1b[0m', `checking state of process... (took ${(Date.now() - start) / 1000.0} seconds)`);
        }

        if (await processResults(orbs, results) !== orbs.ProcessContinue) {
            isDone = true;
            break;
        }

        if (maxNumberOfProcess !== -1 && maxNumberOfProcess <= numberOfCalls) {
            console.log('\x1b[31m%s\x1b[0m', `note processing votes: did not finish after ${numberOfCalls} tries.`);
            break;
        }
    } while (await orbs.isProcessingPeriod());

    if (isDone) {
        await sendSuccessSlack(orbs);
    }

    if (verbose) {
        console.log(`Processing was called ${numberOfCalls} times.`);
    }
}

function compareAddress(a, b) {
    return a.address.toLowerCase() === b.address.toLowerCase();
}

async function sendSuccessSlack(orbs) {
    let electionNumber = await orbs.getNumberOfElections();
    let text = `Hurrah: :trophy: Election ${electionNumber} has finished!\n`;
    let totalVote = await orbs.getTotalStake();
    text += `Total Voting Weight: ${totalVote.toLocaleString()}\n`;

    let electedNow = await orbs.getElectedValidators(electionNumber);
    text += `Number of elected validators: ${electedNow.length}\n`;
    if (electionNumber > 1) {
        let electedBefore = await orbs.getElectedValidators(electionNumber - 1);

        let newElected = _.differenceWith(electedNow, electedBefore, compareAddress);
        if (newElected.length !== 0) {
            text += `Validators(Ethereum Address) newly added:${newElected.map(x => '\n`' + x.address + '`')}\n`;
        }

        let votedOutElected = _.differenceWith(electedBefore, electedNow, compareAddress);
        if (votedOutElected.length !== 0) {
            text += `Validators(Ethereum Address) voted out:${votedOutElected.map(x => '\n`' + x.address + '`')}\n`;
        }
    }

    let validatorsQuery = [];
    for (let i = 0;i < electedNow.length;i++) {
        validatorsQuery.push(orbs.getValidatorStake(electedNow[i].rawAddress))
    }
    let validatorStakes = await Promise.all(validatorsQuery);
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
    text += `Total Validators stake: ${totalValidatorStake.toLocaleString()}\nValidator(Ethereum Address) \`${minValidatorAddress.address}\` has minimum stake: ${minValidatorStake.toLocaleString()}`;

    console.log('\x1b[33m%s\x1b[0m', text);
    await slack.sendSlack(text);
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE`);
    }
    const orbs = await require('./src/orbs')(orbsUrl, orbsVchain, orbsVotingContractName);

    if (await orbs.isProcessingPeriod()) {
        await processCall(orbs);
    } else {
        let currentBlockNumber = await orbs.getCurrentBlockNumber();
        console.log('\x1b[36m%s\x1b[0m', `\n\nCurrent block number: ${currentBlockNumber} is before process vote starting block.
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

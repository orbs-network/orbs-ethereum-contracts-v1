/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
BigInt.prototype.toJSON = function() { return this.toString(); };

const orbsUrl = process.env.ORBS_URL;
const orbsVChain = process.env.ORBS_VCHAINID;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;
const maxErrors = 10;

let verbose = false;
let batchSize = 20;
let maxBatches = 120;
let batchIntervalSeconds = 1;

const slack = require('./src/slack');
const _ = require('lodash');

function validateInput() {
    if (process.env.VERBOSE) {
        verbose = true;
    }

    if (process.env.BATCH_SIZE) {
        batchSize = parseInt(process.env.BATCH_SIZE);
    }

    if (process.env.MAX_BATCHES) {
        maxBatches = parseInt(process.env.MAX_BATCHES);
    }

    if (process.env.BATCH_INTERVAL) {
        batchIntervalSeconds = parseInt(process.env.BATCH_INTERVAL);
    }
}

let numErrors = 0;
let numPendings = 0;
let totalTxSent = 0;
let processStartTime = 0;

function sleep(s) {
    return new Promise(resolve => {
        setTimeout(resolve, s*1000)
    })
}

function processResultsAndCheckForDone(orbs, results) {
    let foundDone = false;
    for (let i = 0; i < results.length; i++) {
        switch (results[i]) {
            case orbs.ProcessDone:
                foundDone = true;
                break;
            case orbs.ProcessError:
                numErrors++;
                break;
            case orbs.ProcessPending:
                numPendings++;
                break;
        }
    }
    return foundDone;
}

async function processCall(orbs) {
    processStartTime = Date.now();
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nStarted Processing...`);
    }

    for (let j = 0;j < maxBatches;j++) {
        let start = Date.now();
        if (verbose) {
            console.log('\x1b[36m%s\x1b[0m', `send batch number ${j+1} of ${batchSize} calls out of ${maxBatches} batches ... `);
        }
        let txs = [];
        for (let i = 0; i < batchSize; i++) {
            txs.push(orbs.processVote());
        }
        totalTxSent += batchSize;

        let results = await Promise.all(txs);

        if (verbose) {
            console.log('\x1b[36m%s\x1b[0m', `checking state of process... (took ${(Date.now() - start) / 1000.0} seconds)`);
        }

        if (processResultsAndCheckForDone(orbs, results)) {
            break;
        }

        if (numErrors >= maxErrors) {
            throw new Error(`Error: Process has exited because too many error responses (${numErrors}) for txs, check Validators Network!`)
        }

        await sleep(batchIntervalSeconds); // slow down
    }

    if (await orbs.isProcessingPeriod()) {
        throw new Error(`Warning: Process has exited after ${totalTxSent} txs, election has not ended! The total number of pending txs was ${numPendings}!`)
    } else {
        await sendSuccessSlack(orbs);
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
    text += `Total Validators stake: ${totalValidatorStake.toLocaleString()}\nValidator(Ethereum Address) \`${minValidatorAddress.address}\` has minimum stake: ${minValidatorStake.toLocaleString()}\n`;

    text += `Statistics:\n`;
    text += `  Total Run time: ${(Date.now() - processStartTime) / 1000.0} seconds\n`;
    text += `  Total Number of Transactions: ${totalTxSent}\n`;
    text += `  Total Number of Tx Results as Pending: ${numPendings}\n`;
    text += `  Total Number of Tx Results as Errors: ${numErrors}\n`;

    console.log('\x1b[33m%s\x1b[0m', text);
    await slack.sendSlack(text);
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE`);
    }
    const orbs = await require('./src/orbs')(orbsUrl, orbsVChain, orbsVotingContractName);

    if (await orbs.isProcessingPeriod()) {
        await processCall(orbs);
    } else {
        let currentBlockNumber = await orbs.getCurrentBlockNumber();
        console.log('\x1b[36m%s\x1b[0m', `\n\nCurrent block number: ${currentBlockNumber} is before process vote starting block.\nProcessing is not needed please try again later!!\n`);
    }
}

main()
    .then(() => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(e => {
        slack.sendSlack(`Process ended with message '${JSON.stringify(e.message)}', check Jenkins!`).finally(() => {
            console.error(e);
            process.exit(-4);
        }
    );
});

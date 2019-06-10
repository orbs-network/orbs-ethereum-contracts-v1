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
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;
let orbsEnvironment = process.env.ORBS_ENVIRONMENT;
let verbose = false;
let fullHistory = false;
let paceGammaTx = 10;
let paceGammaQuery = 1000;
let paceEthereum = 10000;
let startBlock = 0;
let endBlock = 0;

let totalTransfers = 0;
let totalDelegate = 0;

const gamma = require('./src/gamma-calls');
const slack = require('./src/slack');

function validateInput() {
    if (process.env.VERBOSE) {
        verbose = true;
    }

    if (process.env.FORCE_RUN) {
        fullHistory = true;
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

    if (!orbsEnvironment) {
        console.log('No ORBS environment found using default value "local"\n');
        orbsEnvironment = "local";
    }

    if (!orbsVotingContractName) {
        throw("missing env variable ORBS_VOTING_CONTRACT_NAME");
    }

    if (process.env.PACE_ETHEREUM) {
        console.log(`reset value of pace in ethereum to ${process.env.PACE_ETHEREUM}\n`);
        paceEthereum = parseInt(process.env.PACE_ETHEREUM);
        if (paceEthereum < 100  && paceEthereum % 100 !== 0) {
            throw("PACE_ETHEREUM must be a multiplier of 100");
        }
    }

    if (process.env.START_BLOCK_ON_ETHEREUM) {
        startBlock = parseInt(process.env.START_BLOCK_ON_ETHEREUM);
    }
    if (process.env.END_BLOCK_ON_ETHEREUM) {
        endBlock = parseInt(process.env.END_BLOCK_ON_ETHEREUM);
    }
}

async function findNewEvents(events, orbsContractFunctionJson) {
    let newEvents = [];
    for (let i = 0;i < events.length;i=i+paceGammaQuery) {
        let txs = [];
        for (let j = 0; j < paceGammaQuery && i + j < events.length; j++) {
            txs.push(gamma.runQuery(orbsEnvironment, orbsVotingContractName, orbsContractFunctionJson, [events[i+j].txHash]).then(result => {
                return {txHash: events[i+j].txHash, result: result};
            }));
        }
        let queryResults = await Promise.all(txs);
        for (let k = 0; k < queryResults.length; k++) {
            let queryResult = queryResults[k];
            if (queryResult.result.RequestStatus === "COMPLETED" && queryResult.result.ExecutionResult === "ERROR_SMART_CONTRACT") {
                if (queryResult.result.OutputArguments[0].Value === "write attempted without write access: ACCESS_SCOPE_READ_ONLY") {
                    newEvents.push(queryResult.txHash);
                }
            } else {
                console.log('\x1b[31m%s\x1b[0m', `unexpected result for ${queryResult.txHash}. Error OUTPUT:${queryResult.result}\n`);
            }
        }
    }

    return newEvents;
}

async function sendEventsBatch(events, orbsContractFunctionJson) {
    for (let i = 0;i < events.length;i=i+paceGammaTx) {
        try {
            let txs = [];
            for (let j = 0;j < paceGammaTx && i+j < events.length;j++) {
                if (verbose) {
                    console.log('\x1b[32m%s\x1b[0m', `event ${i + j + 1}:`, events[i+j]);
                }
                txs.push(gamma.sendTransaction(orbsEnvironment, orbsVotingContractName, orbsContractFunctionJson, [events[i+j]]));
            }
            await Promise.all(txs);
        } catch (e){
            console.log(`Could not mirror event. Error OUTPUT:\n` + e);
        }
    }
}

async function filterAndSendOnlyNewEvents(events, orbsContractFunctionJson) {
    let newEvents = await findNewEvents(events, orbsContractFunctionJson);
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `Found ${newEvents.length} NEW events`);
    }
    if (newEvents.length > 0) {
        await sendEventsBatch(newEvents, orbsContractFunctionJson);
    }
}

async function transferEvents(ethereumConnectionURL, erc20ContractAddress, startBlock, endBlock) {
    let events = await require('./src/findDelegateByTransferEvents')(ethereumConnectionURL, erc20ContractAddress, startBlock, endBlock);
    totalTransfers += events.length;
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `Found ${events.length} Transfer events`);
    }

    if (events.length > 0) {
        await filterAndSendOnlyNewEvents(events, 'mirror-transfer.json');
    }
}

async function delegateEvents(ethereumConnectionURL, votingContractAddress, startBlock, endBlock) {
    let events = await require('./src/findDelegateEvents')(ethereumConnectionURL, votingContractAddress, startBlock, endBlock);
    totalDelegate += events.length;
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `Found ${events.length} Delegate events`);
    }

    if (events.length > 0) {
        await filterAndSendOnlyNewEvents(events, 'mirror-delegate.json');
    }
}

async function iterateOverEvents(start, end, pace) {
    for (let i = start; i < end; i = i + pace) {
        let minEnd = i + pace < end ? i + pace : end;
        try {
            if (verbose) {
                console.log('\x1b[36m%s\x1b[0m', `\ncurrent iteration between blocks ${i}-${minEnd}`);
            }
            await transferEvents(ethereumConnectionURL, erc20ContractAddress, i, minEnd);
            await delegateEvents(ethereumConnectionURL, votingContractAddress, i, minEnd);
        } catch (e) {
            if (verbose) {
                console.log('\x1b[35m%s\x1b[0m', `too many events, slowing down by factor of 10`);
            }
            if (pace < 20) { // really should not get here
                console.log('\x1b[31m%s\x1b[0m', `something is terrible wrong. exit`);
                await slack.sendSlack(`Warning: mirror failed because event slowing down reached lower thank 20, check Jenkins!`);
                process.exit(-5);
            }
            let newPace = pace / 10;
            for (let j = i; j < minEnd; j = j + newPace) {
                let minminEnd = j + newPace < minEnd ? j + newPace : minEnd;
                await iterateOverEvents(j, minminEnd, newPace);
            }
            if (verbose) {
                console.log('\x1b[35m%s\x1b[0m', `speeding up`);
            }
        }
    }
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE\n`);
    }

    let startTime = Date.now();
    if (fullHistory) {
        startBlock = 7450000;
        endBlock = await gamma.getCurrentBlockNumber(orbsEnvironment, orbsVotingContractName);
    } else if (startBlock === 0) {
        endBlock = await gamma.getCurrentBlockNumber(orbsEnvironment, orbsVotingContractName);
        startBlock = endBlock - 10000;
    } else {
        // use input numbers
    }

    console.log('\x1b[34m%s\x1b[0m', `Going to look for events between blocks ${startBlock}-${endBlock}`);
    await iterateOverEvents(startBlock, endBlock, paceEthereum);
    if (verbose) {
        let endTime = Date.now();
        console.log('\x1b[35m%s\x1b[0m', `took ${Math.floor((endTime-startTime) / 60000)} minutes, ${((endTime-startTime) % 60000) / 1000.0} seconds.`);
    }
    console.log('\x1b[35m%s\x1b[0m', `Processed ${totalTransfers} transfer events and  ${totalDelegate} delegate events.`);
}

main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(e => {
        slack.sendSlack(`Warning: mirror failed with message '${e.message}', check Jenkins!`).then(console.error(e));
    });

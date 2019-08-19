/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
"use strict";
const fs = require('fs');
const _ = require('lodash/core');
const stakes = require('./stakes');

let verbose = false;
if (process.env.VERBOSE) {
    verbose = true;
}

async function readFullGuardianDataFromAddresses(guardianMap, guardianAddresses, web3, guardiansContract, votingContract, tokenContract, stateBlock, votingValidityPeriod) {
    let txs = [];
    for (let i = 0; i < guardianAddresses.length;i++){
        txs.push(guardiansContract.methods.getGuardianData(guardianAddresses[i]).call({}, stateBlock)) ;
        txs.push(votingContract.methods.getCurrentVote(guardianAddresses[i]).call({}, stateBlock));
        txs.push(stakes.readOne(guardianAddresses[i], web3, tokenContract, stateBlock));
    }
    let res = await Promise.all(txs);
    for (let i = 0; i < guardianAddresses.length;i++){
        let g = res[3*i];
        let gVote = res[3*i+1];
        let stake = res[3*i+2];
        let guardianObj = {address: guardianAddresses[i], name: g.name, website: g.website, delegators: [], stake: stake};
        if (gVote && gVote.blockNumber >= stateBlock-votingValidityPeriod) {
            guardianObj.voteBlock = gVote.blockNumber;
            guardianObj.vote = gVote.validators;
        }
        guardianMap[guardianAddresses[i].toLowerCase()] = guardianObj;
    }
}

async function read(web3, guardiansContract, votingContract, tokenContract, stateBlock, votingValidityPeriod) {
    let start = 0, page = 50;
    let guardianMap = {};
    let gAddrs = [];
    do {
        gAddrs = await guardiansContract.methods.getGuardians(start, page).call({}, stateBlock);
        if (verbose) {
            console.log('\x1b[33m%s\x1b[0m', `reading next batch of ${gAddrs.length} guardians`);
        }
        await readFullGuardianDataFromAddresses(guardianMap, gAddrs, web3, guardiansContract, votingContract, tokenContract, stateBlock, votingValidityPeriod);
        start = start + page;
    } while (gAddrs.length >= page);

    console.log('\x1b[36m%s\x1b[0m', `Read ${_.size(guardianMap)} guardians.`);
    return guardianMap;
}

function writeToFile(guardiansMap, filenamePrefix, currentElectionBlock) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `about to save ${_.size(guardiansMap)} guardians information`);
    }
    let csvStr = `Guardian,Name,Website,Stake@${currentElectionBlock}\n`;
    let guardians = _.values(guardiansMap);
    for (let i = 0; i < guardians.length; i++) {
        let guardian = guardians[i];
        csvStr += `${guardian.address},"${guardian.name}","${guardian.website}",${guardian.stake}\n`;
        if (verbose) {
            console.log('%s \x1b[34m%s\x1b[0m %s \x1b[35m%s\x1b[0m %s \x1b[36m%s\x1b[0m %s \x1b[32m%s\x1b[0m',
                `Guardian`, `${guardian.address}`,
                `with name`, `${guardian.name}`,
                `and website`, `${guardian.website}`,
                `has self-stake`, `${guardian.stake}`);
        }
    }

    let path = `${filenamePrefix}_${currentElectionBlock}_guardians.csv`;
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `Guardians information in CSV version file was saved to ${path}!\n`);
}

module.exports = {
    read,
    writeToFile,
};

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const fs = require('fs');
const _ = require('lodash/core');

let verbose = false;
if (process.env.VERBOSE) {
    verbose = true;
}

async function read(web3, guardiansContract, votingContract, stateBlock, votingValidityPeriod) {
    let start = 0, page = 50;
    let guardianMap = {};
    let gAddrs = [];
    do {
        gAddrs = await guardiansContract.methods.getGuardians(start, page).call({}, stateBlock);
        if (verbose) {
            console.log('\x1b[33m%s\x1b[0m', `reading next batch of ${gAddrs.length} guardians`);
        }
        for (let i = 0; i < gAddrs.length;i++){
            let g = await guardiansContract.methods.getGuardianData(gAddrs[i]).call({}, stateBlock);
            let gVote = await votingContract.methods.getCurrentVote(gAddrs[i]).call({}, stateBlock);
            let guardianObj = {address: gAddrs[i], name: g.name, website: g.website, delegators: [], participationReward: 0 };
            if (gVote && gVote.blockNumber >= stateBlock-votingValidityPeriod) {
                guardianObj.voteBlock = gVote.blockNumber;
                guardianObj.vote = gVote.validators;
            }
            guardianMap[gAddrs[i].toLowerCase()] = guardianObj;
        }
        start = start + page;
    } while (gAddrs.length >= page);

    console.log('\x1b[36m%s\x1b[0m', `Read ${_.size(guardianMap)} guardians.`);
    return guardianMap;
}

async function generateFromDelegations(web3, guardiansContract, delegatorsMap) {
    let guardianMap = {};
    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegator = delegators[i];
        guardianMap[delegator.delegateeAddress.toLowerCase()] = {address : delegator.delegateeAddress, stake: 'n/a', delegators: [], participationReward: 0 }
    }
    let guardians = _.values(guardianMap);
    for (let i = 0; i < guardians.length; i++) {
        let guardian = guardians[i];
        let isGuardian = await guardiansContract.methods.isGuardian(guardian.address).call();
        if (isGuardian) {
            let g = await guardiansContract.methods.getGuardianData(guardian.address).call();
            guardian.name = g.name;
            guardian.website = g.website;
        } else {
            guardian.name = 'n/a';
            guardian.website = 'n/a';
        }
    }
    console.log('\x1b[36m%s\x1b[0m', `Generated ${_.size(guardianMap)} guardians from delegation.`);
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
    generateFromDelegations,
    writeToFile,
};

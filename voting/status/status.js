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

let ethereumConnectionURL = process.env.ETHEREUM_NETWORK_URL;
let erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
let votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
let guardiansContractAddress = process.env.GUARDIANS_CONTRACT_ADDRESS;
let startBlock = process.env.START_BLOCK_ON_ETHEREUM;
let endBlock = process.env.END_BLOCK_ON_ETHEREUM;
let filenamePrefix = process.env.OUTPUT_FILENAME_PREFIX;
let paging = process.env.PAGING;
let verbose = false;
const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const GUARDIANS_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianUpdated","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"isGuardian","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardians","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardiansBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"}];

function validateInput() {
    if (process.env.VERBOSE) {
        verbose = true;
    }

    if (!ethereumConnectionURL) {
        throw("missing env variable ETHEREUM_NETWORK_URL");
    }

    if (!erc20ContractAddress) {
        erc20ContractAddress = '0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA';
    }

    if (!votingContractAddress) {
        votingContractAddress = '0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d';
    }

    if (!guardiansContractAddress) {
        guardiansContractAddress = '0xD64B1BF6fCAb5ADD75041C89F61816c2B3d5E711';
    }

    if (!startBlock) {
        startBlock = 7460000;
    }

    if (!endBlock) {
        endBlock = 'latest';
    }

    if (!paging) {
        paging = 1000;
    }

    if (!filenamePrefix) {
        filenamePrefix = 'output';
    }
}

async function readStake(web3, tokenContract, address) {
    let stakeBN = web3.utils.toBN(await tokenContract.methods.balanceOf(address).call());
    let mod10in16 = web3.utils.toBN('10000000000000000');
    let stakeStr = stakeBN.div(mod10in16);
    return parseFloat(stakeStr) / 100.0;
}

function mergeEvents(transferEvents, delegateEvents) {
    let mapper = {};
    for (let i = 0;i < transferEvents.length;i++) {
        mapper[transferEvents[i].delegatorAddress] = transferEvents[i];
    }

    for (let i = 0;i < delegateEvents.length;i++) {
        mapper[delegateEvents[i].delegatorAddress] = delegateEvents[i];
    }

    return mapper;
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

    let delegatorsMap = await mergeEvents(transferEvents, delegateEvents);

    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegtor = delegators[i];
        delegtor.stake = await readStake(web3, tokenContract, delegtor.delegatorAddress);
        if (verbose) {
            console.log('%s \x1b[34m%s\x1b[0m %s \x1b[34m%s\x1b[0m %s \x1b[35m%s\x1b[0m %s \x1b[36m%s\x1b[0m %s \x1b[32m%s\x1b[0m',
                `Delegator`, `${delegtor.delegatorAddress}`,
                `with stake`, `${delegtor.stake}`,
                `delegated to`, `${delegtor.delegateeAddress}`,
                `with a`, `${delegtor.method}`,
                `at block`, `${delegtor.block}`);
        }
    }

    console.log('\x1b[33m%s\x1b[0m', `Merged events into ${delegators.length} delegators.`);
    return delegatorsMap
}
async function writeDelegationsResults(delegatorsMap, web3, tokenContract) {
    let csvStr = 'Delegator,Stake,Delegatee,Method,Block\n';

    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegator = delegators[i];
        csvStr += `${delegator.delegatorAddress},${delegator.stake},${delegator.delegateeAddress},${delegator.method},${delegator.block}\n`;
    }

    let path = filenamePrefix + "_delegations.csv";
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `CSV version file was saved to ${path}!\n`);
}

async function readGuardians(web3, guardiansContract, tokenContract) {
    let start = 0, page = 50;
    let guardianMap = {};
    let gAddrs = [];
    do {
        gAddrs = await guardiansContract.methods.getGuardians(start, page).call();
        if (verbose) {
            console.log('\x1b[33m%s\x1b[0m', `Reading next batch of (${gAddrs.length}) guardians`);
        }
        for (let i = 0; i < gAddrs.length;i++){
            let g = await guardiansContract.methods.getGuardianData(gAddrs[i]).call();
            let stake = await readStake(web3, tokenContract, gAddrs[i]);
            guardianMap[gAddrs[i]] = {address: gAddrs[i], name: g.name, website: g.website, stake: stake, delegators: []};
            if (verbose) {
                console.log('%s \x1b[34m%s\x1b[0m %s \x1b[35m%s\x1b[0m %s \x1b[36m%s\x1b[0m %s \x1b[32m%s\x1b[0m',
                    `Guardian`, `${gAddrs[i]}`,
                    `with name`, `${g.name}`,
                    `and website`, `${g.website}`,
                    `has self-stake`, `${stake}`);
            }
        }

        start = start + page;
    } while (gAddrs.length >= page);

    console.log('\x1b[33m%s\x1b[0m', `Read ${_.size(guardianMap)} guardians.`);
    return guardianMap;
}

async function writeGuardianResults(guardiansMap) {
    let csvStr = 'Guardian,Name,Website,Stake\n';

    let guardians = _.values(guardiansMap);
    for (let i = 0; i < guardians.length; i++) {
        let guardian = guardians[i];
        csvStr += `${guardian.address},${guardian.name},${guardian.website},${guardian.stake}\n`;
    }

    let path = filenamePrefix + "_guardians.csv";
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `CSV version file was saved to ${path}!\n`);
}

async function calculateGuardiansDelegationMap(guardiansMap, delegatorsMap) {

    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegtor = delegators[i];
        if (guardiansMap[delegtor.delegateeAddress]) {
            guardiansMap[delegtor.delegateeAddress].delegators.push(delegtor);
            delegtor.guardian = delegtor.delegateeAddress;
        }
    }


}

async function writeGuardianVotingResults(guardiansMap) {
    let csvStr = 'Guardian,Name,Self Stake,Total Stake\n';

    let guardians = _.values(guardiansMap);
    for (let i = 0; i < guardians.length; i++) {
        let guardian = guardians[i];
        let stake = guardian.stake;
        for (let j = 0; j < guardian.delegators.length;j++) {
            stake = stake + guardian.delegators[j].stake;
        }
        csvStr += `${guardian.address},${guardian.name},${guardian.website},${guardian.stake},${stake}\n`;
    }

    let path = filenamePrefix + "_stakes.csv";
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `CSV version file was saved to ${path}!\n`);
}



async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `VERBOSE MODE`);
    }
    let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));
    let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);

    let results = await readAndMergeEvents(web3, tokenContract, votingContractAddress, startBlock, endBlock);

    await writeDelegationsResults(results, web3, tokenContract);

    let guardiansContract = await new web3.eth.Contract(GUARDIANS_ABI, guardiansContractAddress);
    let guardians = await readGuardians(web3, guardiansContract, tokenContract);

    await writeGuardianResults(guardians);

    calculateGuardiansDelegationMap(guardians, results)

    await writeGuardianVotingResults(guardians);

}



main()
    .then(results => {
        console.log('\x1b[33m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);

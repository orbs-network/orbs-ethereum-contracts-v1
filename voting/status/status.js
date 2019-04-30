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

const delegators = require('./src/delegators');
const guardians = require('./src/guardians');
const stakes = require('./src/stakes');
const voting = require('./src/voting');
const files = require('./src/writeFiles');

const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const GUARDIANS_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianUpdated","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"isGuardian","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardians","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardiansBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"}];
const VOTING_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];
const VALIDATORS_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];

let ethereumConnectionURL = process.env.ETHEREUM_NETWORK_URL;
let erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
let votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
let guardiansContractAddress = process.env.GUARDIANS_CONTRACT_ADDRESS;
let validatorsContractAddress = process.env.VALIDATORS_CONTRACT_ADDRESS;
let processStartBlock = 7440000;
let processEndBlock = 'latest';
let processStatePruning = 5000;
let firstElectionBlock = 7528900;
let electionPeriod = 20000;
let votingValidityPeriod = 45500;
let filenamePrefix = process.env.OUTPUT_FILENAME_PREFIX;
let verbose = false;
if (process.env.VERBOSE) {
    verbose = true;
}
let showOnlyLast = false;

function validateInput() {
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

    if (!validatorsContractAddress) {
        validatorsContractAddress = '0x240fAa45557c61B6959162660E324Bb90984F00f';
    }

    if (process.env.START_BLOCK_ON_ETHEREUM) {
        processStartBlock = parseInt(process.env.START_BLOCK_ON_ETHEREUM);
    }

    if (process.env.END_BLOCK_ON_ETHEREUM) {
        processEndBlock = parseInt(process.env.END_BLOCK_ON_ETHEREUM);
    }

    if (process.env.STATE_PRUNING_BLOCKS_ON_ETHEREUM) {
        processStatePruning = parseInt(process.env.STATE_PRUNING_BLOCKS_ON_ETHEREUM);
    }

    if (process.env.FIRST_ELECTION_ON_ETHEREUM) {
        firstElectionBlock = parseInt(process.env.FIRST_ELECTION_ON_ETHEREUM);
    }

    if (process.env.ELECTION_PERIOD_ON_ETHEREUM) {
        electionPeriod = parseInt(process.env.ELECTION_PERIOD_ON_ETHEREUM);
    }

    if (process.env.VOTING_VALIDITY_PERIOD_ON_ETHEREUM) {
        votingValidityPeriod = parseInt(process.env.VOTING_VALIDITY_PERIOD_ON_ETHEREUM);
    }

    if (!filenamePrefix) {
        filenamePrefix = 'output';
    }
}

/**
 * main
 */
async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `VERBOSE MODE`);
    }
    let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));
    let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);
    let guardiansContract = await new web3.eth.Contract(GUARDIANS_ABI, guardiansContractAddress);
    let votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);

    console.log('\x1b[32m%s\x1b[0m', `Status collection working on period from block ${processStartBlock} to election block ${processEndBlock}`);
    console.log('\x1b[32m%s\x1b[0m', `First election on block ${firstElectionBlock} then every ${electionPeriod} blocks, voting is valid ${votingValidityPeriod} after vote cast.`);
    console.log('\x1b[36m%s\x1b[0m', `Note all stake and vote-casting is checked via Ethereum state on election block.`);
    if (processEndBlock === 'latest' || !processEndBlock || processEndBlock < firstElectionBlock) {
        processEndBlock = await web3.eth.getBlockNumber();
        if (verbose) {
            console.log('\x1b[33m%s\x1b[0m', `latest block: ${processEndBlock}`);
        }
    }
    let processLastStateBlock = processStatePruning === 0 ? 0 : processEndBlock - processStatePruning;

    let eventTxs = { totalTransfers : [], onlyLatestTransfers: {}, totalDelegates : [], onlyLatestDelegates: {}};
    let delegatorsMap = {};
    let accumulatedDelegatorsRewards = {};
    let accumulatedGuardiansRewards = {};

    if (firstElectionBlock-electionPeriod > processStartBlock) {
        console.log('\x1b[34m%s\x1b[0m', `\nPre-election : collecting data in period block ${processStartBlock}-${firstElectionBlock - electionPeriod} (from start to up to one period before first)`);
        let preElectionDelegation = await delegators.read(web3, tokenContract, votingContract, processStartBlock, firstElectionBlock - electionPeriod, eventTxs);
        delegators.update(delegatorsMap, preElectionDelegation);
    }

    let electionNumber = 1;
    for (let startElectionPeriod = firstElectionBlock-electionPeriod; startElectionPeriod < processEndBlock - electionPeriod; startElectionPeriod = startElectionPeriod + electionPeriod) {
        let currentElectionBlock = startElectionPeriod + electionPeriod;
        console.log('\x1b[34m%s\x1b[0m', `\nElection ${electionNumber}: collecting data in period block ${startElectionPeriod}-${currentElectionBlock}`);

        if (verbose) {
            console.log('\x1b[35m%s\x1b[0m', `reading delegation events in this period`);
        }
        let electionPeriodDelegation = await delegators.read(web3, tokenContract, votingContract, startElectionPeriod, currentElectionBlock, eventTxs);
        delegators.update(delegatorsMap, electionPeriodDelegation);
        if (_.size(delegatorsMap) === 0) {
            console.log('\x1b[34m%s\x1b[0m', `Election ${electionNumber}: no delegation data skipping`);
            electionNumber++;
            continue;
        }
        if (currentElectionBlock > processLastStateBlock) {
            await stakes.read(delegatorsMap, web3, tokenContract, currentElectionBlock);
        }
        await delegators.writeToFile(delegatorsMap, filenamePrefix, currentElectionBlock);
        await delegators.writeTxToFile(eventTxs, filenamePrefix, currentElectionBlock);

        if (currentElectionBlock > processLastStateBlock) {
            if (verbose) {
                console.log('\x1b[35m%s\x1b[0m', `reading guardians events in this period`);
            }
            let guardiansMap = await guardians.read(web3, guardiansContract, votingContract, currentElectionBlock, votingValidityPeriod);
            await stakes.read(guardiansMap, web3, tokenContract, currentElectionBlock);
            guardians.writeToFile(guardiansMap, filenamePrefix, currentElectionBlock);

            // let validators = readValidators(validatorsContract);
            // await readStakes(validators, electionBlock);
            // await writeValidatorsResults(validators);

            if (verbose) {
                console.log('\x1b[35m%s\x1b[0m', `doing calculation for election results`);
            }
            let voteResults = voting.calculate(guardiansMap, accumulatedGuardiansRewards, delegatorsMap, accumulatedDelegatorsRewards);
            voting.writeToFile(voteResults, filenamePrefix, currentElectionBlock);
        } else {
            if (verbose) {
                console.log('\x1b[35m%s\x1b[0m', `generating guardians from input`);
            }
            let guardiansMap = await guardians.generateFromDelegations(web3, guardiansContract, delegatorsMap);
            let voteResults = voting.calculate(guardiansMap, accumulatedGuardiansRewards, delegatorsMap, accumulatedDelegatorsRewards);
            voting.writeToFile(voteResults, filenamePrefix, currentElectionBlock);
        }
        electionNumber++;
    }

}



main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "Done!!");
    }).catch(console.error);

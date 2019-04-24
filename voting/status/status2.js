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
let validatorsContractAddress = process.env.VALIDATORS_CONTRACT_ADDRESS;
let processStartBlock = 7440000;
let processEndBlock = 'latest';
let firstElectionBlock = 7528900;
let electionPeriod = 20000;
let votingValidityPeriod = 45500;
let filenamePrefix = process.env.OUTPUT_FILENAME_PREFIX;
let verbose = false;
const TOKEN_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const GUARDIANS_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianUpdated","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"isGuardian","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardians","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardiansBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"}];
const VOTING_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];
const VALIDATORS_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}];

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

    if (!validatorsContractAddress) {
        validatorsContractAddress = '0x240fAa45557c61B6959162660E324Bb90984F00f';
    }

    if (process.env.START_BLOCK_ON_ETHEREUM) {
        processStartBlock = parseInt(process.env.START_BLOCK_ON_ETHEREUM);
    }

    if (process.env.END_BLOCK_ON_ETHEREUM) {
        processEndBlock = parseInt(process.env.END_BLOCK_ON_ETHEREUM);
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
 * Delegators
 */
function mergeEvents(transferEvents, delegateEvents) {
    let mapper = {};
    for (let i = 0;i < transferEvents.length;i++) {
        mapper[transferEvents[i].address.toLowerCase()] = transferEvents[i];
    }

    for (let i = 0;i < delegateEvents.length;i++) {
        mapper[delegateEvents[i].address.toLowerCase()] = delegateEvents[i];
    }

    return mapper;
}

async function readDelegations(web3, tokenContract, votingContract, startBlock, endBlock, eventTxs) {
    let transferEvents = await require('./node-scripts/findDelegateByTransferEvents')(web3, tokenContract, startBlock, endBlock, 1000, verbose, eventTxs);
    if (verbose) {
        console.log(`Found ${transferEvents.length} Transfer events on Token Contract Address ${tokenContract.address}`);
    }

    let delegateEvents = await require('./node-scripts/findDelegateEvents')(votingContract, startBlock, endBlock, 20000, verbose, eventTxs);
    if (verbose) {
        console.log(`Found ${delegateEvents.length} Delegate events on Voting Contract Address ${votingContractAddress}`);
    }

    let delegatorsMap = await mergeEvents(transferEvents, delegateEvents);
    console.log('\x1b[36m%s\x1b[0m', `Merged events into ${_.size(delegatorsMap)} delegators.`);
    return delegatorsMap
}

function updateDelegations(accumulatedDelegatorsMap, delegatorsMap) {
    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegator = delegators[i];
        let shouldReplace = false;
        if (accumulatedDelegatorsMap[delegator.address.toLowerCase()]) {
            let currDel = accumulatedDelegatorsMap[delegator.address.toLowerCase()];
            if (currDel.method === 'Transfer' && delegator.method === 'Delegate' ) {
                shouldReplace = true;
//                console.log("new by method")
            } else if ( currDel.method === delegator.method &&
                ( (delegator.block > currDel.block) || (delegator.block === currDel.block && delegator.transactionIndex > currDel.transactionIndex))) {
                shouldReplace = true;
//               console.log("newer block")
            }
        } else {
//            console.log("new new")
            shouldReplace = true;
        }

        if (shouldReplace === true) {
            accumulatedDelegatorsMap[delegator.address.toLowerCase()] = delegator;
        }
    }
    console.log('\x1b[36m%s\x1b[0m', `Update events now we have ${_.size(accumulatedDelegatorsMap)} delegators.`);
}

async function writeDelegationsResults(delegatorsMap, currentElectionBlock) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `about to save ${_.size(delegatorsMap)} delegators information`);
    }
    let csvStr = `Delegator,Stake@${currentElectionBlock},Delegatee,Method,Block\n`;
    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegator = delegators[i];
        csvStr += `${delegator.address},${delegator.stake},${delegator.delegateeAddress},${delegator.method},${delegator.block}\n`;
        if (verbose) {
            console.log('%s \x1b[34m%s\x1b[0m %s \x1b[34m%s\x1b[0m %s \x1b[35m%s\x1b[0m %s \x1b[36m%s\x1b[0m %s \x1b[32m%s\x1b[0m',
                `Delegator`, `${delegator.address}`,
                `with stake`, `${delegator.stake}`,
                `delegated to`, `${delegator.delegateeAddress}`,
                `with a`, `${delegator.method}`,
                `at block`, `${delegator.block}`);
        }
    }

    let path = `${currentElectionBlock}_${filenamePrefix}_delegations.csv`;
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `Delegators information in CSV version file was saved to ${path}!\n`);
}

async function writeOneDelegationTxResults(list, typeStr, currentElectionBlock) {
    let csvStr = `Delegator,Block,TxIndex,TxHash\n`;
    for (let i = 0; i < list.length; i++) {
        let obj = list[i];
        csvStr += `${obj.address},${obj.block},${obj.txIndex},${obj.txHash}\n`;
    }

    let path = `${currentElectionBlock}_${filenamePrefix}_${typeStr}.csv`;
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `Delegation ${typeStr} information saved to CSV file ${path}!\n`);
}

async function writeDelegationsTxResults(eventTxs, currentElectionBlock) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `about to save tx of delegations`);
    }
    let latestTransfers = _.values(eventTxs.onlyLatestTransfers);
    let latestDelegates = _.values(eventTxs.onlyLatestDelegates);
    await writeOneDelegationTxResults(eventTxs.totalTransfers, "TotalTransfers", currentElectionBlock);
    await writeOneDelegationTxResults(latestTransfers, "LatestTransfersOnly", currentElectionBlock);
    await writeOneDelegationTxResults(eventTxs.totalDelegates, "TotalDelegates", currentElectionBlock);
    await writeOneDelegationTxResults(latestDelegates, "LatestDelegatesOnly", currentElectionBlock);

    let latestMap = {};
    for(let i = 0; i < latestTransfers.length;i++) {
        let t = latestTransfers[i];
        latestMap[t.address] = t;
    }
    for(let i = 0; i < latestDelegates.length;i++) {
        let d = latestDelegates[i];console.log(d);
        latestMap[d.address] = d;
    }
    await writeOneDelegationTxResults(_.values(latestMap), "LatestCombined", currentElectionBlock);
}

/***
 * stakes
 */
async function readGuardians(web3, guardiansContract, votingContract, stateBlock) {
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
            let guardianObj = {address: gAddrs[i], name: g.name, website: g.website, delegators: []};
            if (gVote && gVote.blockNumber >= stateBlock-votingValidityPeriod) {
                console.log(gVote);
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

async function writeGuardianResults(guardiansMap, currentElectionBlock) {
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

    let path = `${currentElectionBlock}_${filenamePrefix}_guardians.csv`;
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `Guardians information in CSV version file was saved to ${path}!\n`);
}

/***
 * stakes
 */
function parseStake(web3, str) {
    let stakeBN = web3.utils.toBN(str);
    let mod10in16 = web3.utils.toBN('10000000000000000');
    let stakeStr = stakeBN.div(mod10in16);
    return parseFloat(stakeStr) / 100.0;
}

let stakePace = 25;
async function readStakes(objectsMap, web3, tokenContract, stateBlock) {
    let objectList = _.values(objectsMap);
    for (let i = 0; i < objectList.length; i=i+stakePace) {
        let txs = [];
        if (verbose) {
            console.log('\x1b[33m%s\x1b[0m', `reading stakes, currently ${i} out of ${objectList.length}`);
        }
        for (let j = 0; j < stakePace && j+i< objectList.length; j++) {
            txs.push(tokenContract.methods.balanceOf(objectList[i + j].address).call({}, stateBlock).then(balanceStr => {
                objectsMap[objectList[i + j].address.toLowerCase()].stake = parseStake(web3, balanceStr);
            }));
        }
        await Promise.all(txs);
    }
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `finished reading stakes at block number ${stateBlock}`);
    }
}

/**
 * delegation to guardians mappings
 */
function recursiveFollowDelegation(originaDelegateAddress, potentialGuardianAddress, guardiansMap, delegatorsMap, level) {
    if (guardiansMap[potentialGuardianAddress]) { // got to guardian
        guardiansMap[potentialGuardianAddress].delegators.push(originaDelegateAddress);
        delegatorsMap[originaDelegateAddress].guardian = potentialGuardianAddress;
        delegatorsMap[originaDelegateAddress].guardianLevel = level;
        if (verbose) {
            console.log('\x1b[33m%s\x1b[0m', `delegator ${originaDelegateAddress} gave his voice to guardian ${potentialGuardianAddress} (${level === 0 ? 'directly' : `with ${level} intermediaries`})`);
        }
    } else if (delegatorsMap[potentialGuardianAddress]) { // delegate to delegate
        if (level >= 5) {
//            console.log(`d ${originaDelegateAddress} reached ${level} ignore`)
            return;
        }
//        console.log(`d ${originaDelegateAddress} gave to d ${potentialGuardianAddress} at level ${level} going forward to ${delegatorsMap[potentialGuardianAddress].address}`)
        recursiveFollowDelegation(originaDelegateAddress, delegatorsMap[potentialGuardianAddress].delegateeAddress.toLowerCase(), guardiansMap, delegatorsMap, level+1);
    } else {
//        console.log(`d ${originaDelegateAddress} doesn't point to known address ignore`)
    }
}

function calculateGuardiansDelegationMap(guardiansMap, delegatorsMap) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `calculating delegation...`);
    }
    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegtor = delegators[i];
        recursiveFollowDelegation(delegtor.address.toLowerCase(), delegtor.delegateeAddress.toLowerCase(), guardiansMap, delegatorsMap, 0);
    }
}

async function writeGuardianVotingResults(guardiansMap, delegatorsMap, currentElectionBlock) {
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `about to save ${_.size(guardiansMap)} guardians delegation information`);
    }
    let csvStr = `Guardian,Name,Delegator,Self Stake,Vote Stake@${currentElectionBlock}, Total Vote Stake@${currentElectionBlock},Voted,VoteOut1,VoteOut2,VoteOut3\n`;
    let guardians = _.values(guardiansMap);
    for (let i = 0; i < guardians.length; i++) {
        let guardian = guardians[i];
        let stake = Math.trunc(guardian.stake);
        let csvStrDel = '';
        for (let j = 0; j < guardian.delegators.length;j++) {
            let delegator = delegatorsMap[guardian.delegators[j]];
            stake = stake + Math.trunc(delegator.stake);
            csvStrDel += `,,${delegator.address},${delegator.stake},${Math.trunc(delegator.stake)},\n`;
        }
        csvStr += `${guardian.address},"${guardian.name}",,${guardian.stake},${Math.trunc(guardian.stake)},${stake},`;
        if (guardian.voteBlock) {
            csvStr += `${guardian.voteBlock},`;
            if (guardian.vote.length > 0) {
                csvStr += `${guardian.vote[0]},`;
            }
            if (guardian.vote.length > 1) {
                csvStr += `${guardian.vote[1]},`;
           }
            if (guardian.vote.length > 2) {
                csvStr += `${guardian.vote[2]},`;
            }
        } else {
            csvStr += 'false,';
        }
        csvStr += `\n${csvStrDel}`;
    }

    csvStr += `N/A,these didn't delegate to real guardian,,,\n`;
    let delegators = _.values(delegatorsMap);
    for (let i = 0; i < delegators.length; i++) {
        let delegator = delegators[i];
        if (!delegator.guardian) {
            csvStr += `,,${delegator.address},${delegator.stake},\n`;
        }
    }

    let path = `${currentElectionBlock}_${filenamePrefix}_votes.csv`;
    fs.writeFileSync(path, csvStr);
    console.log('\x1b[33m%s\x1b[0m', `CSV version file was saved to ${path}!\n`);
}

/**
 * main
 */
async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[33m%s\x1b[0m', `VERBOSE MODE`);
    }
    // connect to ethereum
    let web3Infura = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));//await new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/9679dc4f2d724f7997547f05f769d74e"));
    let tokenContractInfura = await new web3Infura.eth.Contract(TOKEN_ABI, erc20ContractAddress);
    let votingContractInfura = await new web3Infura.eth.Contract(VOTING_ABI, votingContractAddress);

    let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));
    let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);
    let guardiansContract = await new web3.eth.Contract(GUARDIANS_ABI, guardiansContractAddress);
    let votingContract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);

    console.log('\x1b[32m%s\x1b[0m', `Status collection working on period from block ${processStartBlock} to election block ${processEndBlock}`);
    console.log('\x1b[32m%s\x1b[0m', `First election on block ${firstElectionBlock} then every ${electionPeriod} blocks, voting is valid ${votingValidityPeriod} after vote cast.`);
    console.log('\x1b[36m%s\x1b[0m', `Note all stake and vote-casting is checked via Ethereum state on election block.`);
    if (processEndBlock === 'latest' || !processEndBlock || processEndBlock < 7440000) {
        processEndBlock = await web3Infura.eth.getBlockNumber();
        if (verbose) {
            console.log('\x1b[33m%s\x1b[0m', `latest block: ${processEndBlock}`);
        }
    }

    let eventTxs = { totalTransfers : [], onlyLatestTransfers: {}, totalDelegates : [], onlyLatestDelegates: {}};
    let accumumlatedDelegations = {};
    if (firstElectionBlock-electionPeriod > processStartBlock) {
        console.log('\x1b[34m%s\x1b[0m', `\nPre-election : collecting data in period block ${processStartBlock}-${firstElectionBlock - electionPeriod} (from start to up to one period before first)`);
        let preElectionDelegation = await readDelegations(web3Infura, tokenContractInfura, votingContractInfura, processStartBlock, firstElectionBlock - electionPeriod, eventTxs);
        updateDelegations(accumumlatedDelegations, preElectionDelegation);
    }

    let electionNumer = 1;
    for (let startElectionPeriod = firstElectionBlock-electionPeriod; startElectionPeriod < processEndBlock-electionPeriod; startElectionPeriod = startElectionPeriod + electionPeriod) {
        let currentElectionBlock = startElectionPeriod + electionPeriod;
        console.log('\x1b[34m%s\x1b[0m', `\nElection ${electionNumer}: collecting data in period block ${startElectionPeriod}-${currentElectionBlock}`);

        if (verbose) {
            console.log('\x1b[35m%s\x1b[0m', `reading delegation events in this period`);
        }
        let electionPeriodDelegation = await readDelegations(web3Infura, tokenContractInfura, votingContractInfura, startElectionPeriod, currentElectionBlock, eventTxs);
        updateDelegations(accumumlatedDelegations, electionPeriodDelegation);
        if (_.size(accumumlatedDelegations) === 0) {
            console.log('\x1b[34m%s\x1b[0m', `Election ${electionNumer}: no delegation data skipping`);
            electionNumer++;
            continue;
        }
        await readStakes(accumumlatedDelegations, web3, tokenContract, currentElectionBlock);
        await writeDelegationsResults(accumumlatedDelegations, currentElectionBlock);
        await writeDelegationsTxResults(eventTxs, currentElectionBlock);

        if (verbose) {
            console.log('\x1b[35m%s\x1b[0m', `reading guardians events in this period`);
        }
        let guardians = await readGuardians(web3, guardiansContract, votingContract, currentElectionBlock);
        await readStakes(guardians, web3, tokenContract, currentElectionBlock);
        await writeGuardianResults(guardians, currentElectionBlock);

        // let validators = readValidators(validatorsContract);
        // await readStakes(validators, electionBlock);
        // await writeValidatorsResults(validators);

        if (verbose) {
            console.log('\x1b[35m%s\x1b[0m', `doing calculation for election results`);
        }
        calculateGuardiansDelegationMap(guardians, accumumlatedDelegations);
        await writeGuardianVotingResults(guardians, accumumlatedDelegations, currentElectionBlock);

        electionNumer++;
    }

}



main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "Done!!");
    }).catch(console.error);

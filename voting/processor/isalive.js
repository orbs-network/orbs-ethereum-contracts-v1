/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const Web3 = require('web3');
const gamma = require('./src/gamma-calls');
const slack = require('./src/slack');

const ethereumConnectionURL = process.env.NETWORK_URL_ON_ETHEREUM;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;
let orbsEnvironment = process.env.ORBS_ENVIRONMENT;

function validateInput() {
    if (!ethereumConnectionURL) {
        throw("missing env variable NETWORK_URL_ON_ETHEREUM");
    }

    if (!orbsVotingContractName) {
        throw("missing env variable ORBS_VOTING_CONTRACT_NAME");
    }

    if (!orbsEnvironment) {
        console.log('No ORBS environment found using default value "local"\n');
        orbsEnvironment = "local";
    }
}

async function main() {
    validateInput();
    let web3 = await new Web3(new Web3.providers.HttpProvider(ethereumConnectionURL));

    let currentBlockNumberByOrbs = await gamma.getCurrentBlockNumber(orbsEnvironment, orbsVotingContractName);
    let currentBlockNumberByEthereum = 0;
    try {
        currentBlockNumberByEthereum = await web3.eth.getBlockNumber();
    } catch {
        console.error(e);
        currentBlockNumberByEthereum = 0;
    }
    if (currentBlockNumberByOrbs === 0 || currentBlockNumberByEthereum === 0 || (currentBlockNumberByOrbs + 200) < currentBlockNumberByEthereum || (currentBlockNumberByEthereum + 200) < currentBlockNumberByOrbs) {
        let message = `Warning: Current block number reading from Orbs: ${currentBlockNumberByOrbs} is too far away from current block reading from Ethereum : ${currentBlockNumberByEthereum}.
 Orbs and Ethereum are out of Sync.\n`;
        console.log('\x1b[31m%s\x1b[0m', message);
        await slack.sendSlack(message);
        process.exit(-3)
    }

    let processStartBlockNumber = await gamma.getProcessingStartBlockNumber(orbsEnvironment, orbsVotingContractName);
    if (processStartBlockNumber === 0 || currentBlockNumberByOrbs >= (processStartBlockNumber + 600) ) {
        let message = `Warning: Current block number: ${currentBlockNumberByOrbs} is well after process vote starting block number: ${processStartBlockNumber}.
 Something is wrong with elections, it seems stuck.\n`;
        console.log('\x1b[31m%s\x1b[0m', message);
        await slack.sendSlack(message);
        process.exit(-2)
    }

    console.log('\x1b[35m%s\x1b[0m', `Current block from Orbs: ${currentBlockNumberByOrbs}
current block from Ethereum  ${currentBlockNumberByEthereum}
Election processing start block: ${processStartBlockNumber}.`);

}

main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "\nAll Good Done!!");
    }).catch(e => {
        slack.sendSlack(`Warning: isalive failed with message '${e.message}', check Jenkins!`).then( ()=>{console.error(e);process.exit(-4);});
    });

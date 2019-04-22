/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

let verbose = false;
if (process.env.VERBOSE) {
    verbose = true;
}

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function runQuery(orbsContractFunctionJson, orbsVotingContractName, orbsEnvironment) {
    let command = `gamma-cli run-query ./gammacli-jsons/${orbsContractFunctionJson} -signer user1 -name ${orbsVotingContractName} -env ${orbsEnvironment}`;
    const {stdout, stderr } = await exec(command);
    if (stdout.length === 0 && stderr.length > 0){
        throw new Error(stderr);
    }
    let result = JSON.parse(stdout);

    if (!(result.RequestStatus === "COMPLETED" && result.ExecutionResult === "SUCCESS")) {
        throw new Error(`problem running query result:\n${stdout}`);
    }
    if (verbose) {
        console.log(`RUNNING: ${command}\n`, `OUTPUT:\n`, result);
    }
    return result;
}

async function sendTransaction(orbsContractFunctionJson, args, orbsVotingContractName, orbsEnvironment) {
    let argsString = '';
    for (let i = 0;i < args.length;i++) {
        argsString += ` -arg${i+1} ${args[i]}`;
    }
    let command = `gamma-cli send-tx ./gammacli-jsons/${orbsContractFunctionJson} -signer user1 -name ${orbsVotingContractName} ${argsString} -env ${orbsEnvironment}`;
    const {stdout, stderr } = await exec(command);
    if (stdout.length === 0 && stderr.length > 0){
        throw new Error(stderr);
    }
    let result = JSON.parse(stdout);
    if (verbose) {
        console.log(`RUNNING: ${command}\n`, `OUTPUT:\n`, result);
    }
    return result;
}

async function getCurrentBlockNumber(orbsVotingContractName, orbsEnvironment) {
    let blockNumber = 0;
    try {
        let result = await runQuery('get-current-block.json', orbsVotingContractName, orbsEnvironment);
        blockNumber = parseInt(result.OutputArguments[0].Value)
    } catch (e){
        console.log(`Could not get current block number. Error OUTPUT:\n` + e);
    }
    return blockNumber;
}

module.exports = {
    runQuery,
    sendTransaction,
    getCurrentBlockNumber,
};

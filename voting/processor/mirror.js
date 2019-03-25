const ethereumConnectionURL = process.env.NETWORK_URL_ON_ETHEREUM;
const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
const startBlock = process.env.START_BLOCK_ON_ETHEREUM;
const endBlock = process.env.END_BLOCK_ON_ETHEREUM;
let orbsEnvironment = process.env.ORBS_ENVIRONMENT;
let verbose = false;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;

const gamma = require('./gamma-calls');

function validateInput() {
    if (process.env.VERBOSE) {
        verbose = true;
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

    if (!startBlock) {
        throw("missing env variable START_BLOCK_ON_ETHEREUM");
    }

    if (!endBlock) {
        throw("missing env variable END_BLOCK_ON_ETHEREUM");
    }

    if (!orbsVotingContractName) {
        throw("missing env variable ORBS_VOTING_CONTRACT_NAME");
    }

    if (!orbsEnvironment) {
        console.log('No ORBS environment found using default value "local"\n');
        orbsEnvironment = "local";
    }
}

async function transferEvents() {
    let transferEvents = await require('./node-scripts/findDelegateByTransferEvents')();
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nFound ${transferEvents.length} Transfer events:`);
    }

    for (let i = 0;i < transferEvents.length;i++) {
        try {
            if (verbose) {
                console.log('\x1b[32m%s\x1b[0m', `Transfer event ${i + 1}:`);
                console.log(transferEvents[i]);
            }
            await gamma.sendTransaction('mirror-transfer.json', [transferEvents[i].txHash], orbsVotingContractName, orbsEnvironment);
        } catch (e){
            console.log(`Could not mirror transfer event. Error OUTPUT:\n` + e);
        }
    }
}

async function delegateEvents() {
    let delegateEvents = await require('./node-scripts/findDelegateEvents')();
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nFound ${delegateEvents.length} Delegate events`);
    }

    for (let i = 0;i < delegateEvents.length;i++) {
        try {
            if (verbose) {
                console.log('\x1b[32m%s\x1b[0m', `Delegation event ${i + 1}:`);
                console.log(delegateEvents[i]);
            }
            await gamma.sendTransaction('mirror-delegate.json', [delegateEvents[i].txHash], orbsVotingContractName, orbsEnvironment);
        } catch (e){
            console.log(`Could not mirror delegation event. Error OUTPUT:\n` + e);
        }
    }
}

async function getMirrorEndingBlockNumber() {
    let blockNumber = 0;
    try {
        let result = await gamma.runQuery('get-mirroring-end-block.json', orbsVotingContractName, orbsEnvironment);
        blockNumber = parseInt(result.OutputArguments[0].Value)
    } catch (e){
        console.log(`Could not get mirror ending block number. Error OUTPUT:\n` + e);
    }
    return blockNumber;
}

async function getMirrorStartingBlockNumber() {
    let blockNumber = 0;
    try {
        let result = await gamma.runQuery('get-mirroring-start-block.json', orbsVotingContractName, orbsEnvironment);
        blockNumber = parseInt(result.OutputArguments[0].Value)
    } catch (e){
        console.log(`Could not get mirror starting block number. Error OUTPUT:\n` + e);
    }
    return blockNumber;
}

async function isMirroringAllowed() {
    let currentBlockNumber = await gamma.getCurrentBlockNumber(orbsVotingContractName, orbsEnvironment);
    let mirrorStartingBlockNumber = await getMirrorStartingBlockNumber();
    let mirrorEndingBlockNumber = await getMirrorEndingBlockNumber();

    if (currentBlockNumber >= mirrorStartingBlockNumber && currentBlockNumber < mirrorEndingBlockNumber) {
        return true;
    } else {
        console.log('\x1b[36m%s\x1b[0m', `\n\nCurrent block number: ${currentBlockNumber}\nElection block number: ${mirrorStartingBlockNumber}\nMirror ending  block number: ${mirrorEndingBlockNumber}.
         Mirroring is not needed please try again later!!\n`);
        return false;
    }
}

async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE`);
    }

    isAllowed = await isMirroringAllowed();
    if (isAllowed) {
        await transferEvents();
        await delegateEvents();
    }
}

main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);

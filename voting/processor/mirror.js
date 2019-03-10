const ethereumConnectionURL = process.env.NETWORK_URL_ON_ETHEREUM;
const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
const startBlock = process.env.START_BLOCK_ON_ETHEREUM;
const endBlock = process.env.END_BLOCK_ON_ETHEREUM;
let orbsEnvironment = process.env.ORBS_ENVIRONMENT;
let verbose = false;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

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
        let command = `gamma-cli send-tx ./gammacli-jsons/mirror-transfer.json -signer user1 -name ${orbsVotingContractName} -arg1 ${transferEvents[i].txHash} -env ${orbsEnvironment}`;
        if (verbose) {
            console.log('\x1b[32m%s\x1b[0m', `Transfer event ${i+1}:`);
            console.log(transferEvents[i]);
            console.log(`RUNNING: ${command}`);
        }
        const {stdout} = await exec(command);
        let result = JSON.parse(stdout);

        if (!(result.RequestStatus === "COMPLETED" && result.ExecutionResult === "SUCCESS")) {
            if (result.OutputArguments.length > 0 && result.OutputArguments[0].Value.indexOf("failed since already have delegation with method Delegate") !== -1) {
                if (verbose) {
                    console.log('\x1b[33m%s\x1b[0m', `mirroring transfer event with txHash ${transferEvents[i].txHash} skipped because a stronger event exists (no problem here)`)
                }
            } else {
                throw new Error(`problem mirroring transfer event with txHash ${transferEvents[i].txHash} result:\n${stdout}`);
            }
        } else if (verbose) {
            console.log(`OUTPUT:`);
            console.log(result);
        }
    }
}

async function delegateEvents() {
    let delegateEvents = await require('./node-scripts/findDelegateEvents')();
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nFound ${delegateEvents.length} Delegate events`);
    }

    for (let i = 0;i < delegateEvents.length;i++) {
        let command = `gamma-cli send-tx ./gammacli-jsons/mirror-delegate.json -signer user1 -name ${orbsVotingContractName} -arg1 ${delegateEvents[i].txHash} -env ${orbsEnvironment}`;
        if (verbose) {
            console.log('\x1b[32m%s\x1b[0m', `Delegation event ${i+1}:`);
            console.log(delegateEvents[i]);
            console.log(`RUNNING: ${command}`);
        }
        const {stdout} = await exec(command);
        let result = JSON.parse(stdout);

        if (!(result.RequestStatus === "COMPLETED" && result.ExecutionResult === "SUCCESS")) {
            throw new Error(`problem mirroring delegate event with txHash ${delegateEvents[i].txHash} result:\n${stdout}`);
        }
        if (verbose) {
            console.log(`OUTPUT:`);
            console.log(result);
        }
    }
}

async function voteEvents() {
    let voteEvents = await require('./node-scripts/findVoteEvents')();
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nFound ${voteEvents.length} Vote events`);
    }

    for (let i = 0;i < voteEvents.length;i++) {
        let command = `gamma-cli send-tx ./gammacli-jsons/mirror-vote.json -signer user1 -name ${orbsVotingContractName} -arg1 ${voteEvents[i].txHash} -env ${orbsEnvironment}`;
        if (verbose) {
            console.log('\x1b[32m%s\x1b[0m', `Voting event ${i+1}:`);
            console.log(voteEvents[i]);
            console.log(`RUNNING: ${command}`);
        }
        const {stdout} = await exec(command);
        let result = JSON.parse(stdout);

        if (!(result.RequestStatus === "COMPLETED" && result.ExecutionResult === "SUCCESS")) {
            throw new Error(`problem mirroring vote event  with txHash ${voteEvents[i].txHash} result:\n${stdout}`);
        }
        if (verbose) {
            console.log(`OUTPUT:`);
            console.log(result);
        }
    }
}


async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE`);
    }

    //await Promise.all([transferEvents(), delegateEvents(), voteEvents()]);
    await transferEvents();
    await delegateEvents();
    await voteEvents();

}

main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);

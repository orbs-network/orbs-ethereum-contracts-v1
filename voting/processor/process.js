let orbsEnvironment = process.env.ORBS_ENVIRONMENT;
let verbose = false;
let maxNumberOfProcess  = process.env.MAXIMUM_NUMBER_OF_TRIES;
const orbsVotingContractName = process.env.ORBS_VOTING_CONTRACT_NAME;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

function validateInput() {
    if (!orbsEnvironment) {
        console.log('No ORBS environment found using default value "local"\n');
        orbsEnvironment = "local";
    }

    if (!orbsVotingContractName) {
        throw("missing env variable ORBS_VOTING_CONTRACT_NAME");
    }

    if (!maxNumberOfProcess || maxNumberOfProcess === 0 || maxNumberOfProcess === "0") {
        maxNumberOfProcess = -1;
    }

    if (process.env.VERBOUSE) {
        verbose = true;
    }

}

async function processCall() {
    if (verbose) {
        console.log('\x1b[34m%s\x1b[0m', `\nStarted Processing...`);
    }

    let isDone = 0;
    let numberOfCalls = 0;
    do {
        let command = `gamma-cli send-tx ./gammacli-jsons/process-voting.json -signer user1 -name ${orbsVotingContractName} -env ${orbsEnvironment}`;
        const {stdout} = await exec(command);
        let result = JSON.parse(stdout);

        if (!(result.RequestStatus === "COMPLETED" && result.ExecutionResult === "SUCCESS") || result.OutputArguments.length === 0 ) {
            throw new Error(`problem processing votes result:\n${stdout}`);
        }

        isDone = result.OutputArguments[0].Value === "1" ? 1 : 0;

        if (verbose && numberOfCalls !== 0 && (numberOfCalls % 10) === 0) {
            console.log(`still processing ... `);
        }

        numberOfCalls++;
        if (maxNumberOfProcess !== -1 && maxNumberOfProcess <= numberOfCalls) {
            throw new Error(`problem processing votes did not finish after ${numberOfCalls} tries.`);
        }
    } while (isDone === 0);

    if (verbose) {
        console.log(`Processing was called ${numberOfCalls} times.`);
    }

}


async function main() {
    validateInput();
    if (verbose) {
        console.log('\x1b[35m%s\x1b[0m', `VERBOSE MODE`);
    }
    await processCall();
}

main()
    .then(results => {
        console.log('\x1b[36m%s\x1b[0m', "\n\nDone!!\n");
    }).catch(console.error);

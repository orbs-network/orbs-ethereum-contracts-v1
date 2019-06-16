const {EthereumAdapter, OrbsAdapter} = require("psilo");
const {expect, use} = require("chai");
const {Driver} = require("./driver");
const {orbsAssertions} = require("psilo");
const fs = require("fs");
const Orbs = require("orbs-client-sdk");
const { spawn, exec } = require("child_process");
const path = require("path");

const helpers = require('./helpers');

use(orbsAssertions);

function ipToHexaBytes(ip) {
    const decimalElements = ip.split(".");

    expect(decimalElements).to.be.length(4);
    const twoDigitHexElements = decimalElements.map(e => ('0' + parseInt(e).toString(16)).slice(-2));

    return `0x${twoDigitHexElements.join('')}`
}

const guardiansAccounts = [4, 6, 10, 11];
const validatorAccounts = [20, 21, 22, 23, 24];

// stake
// 0      1      2,    3,    4,    5,    6,     7, 8,     9,    10,,,,11,12,13,14,15,16,17,18,19,20,,,,,21,,,,,22,,,,,23,,,,24
// 10000, 10000, 8000, 8000, 6000, 6000, 34000, 0, 20000, 5000, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10000, 20000, 15000, 5000, 7000

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function advanceByOneBlock(orbs) {
    const signer = orbs.accounts[0];
    const [t] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, "_Info", "isAlive", []);
    return await orbs.client.sendTransaction(t);
}

async function waitForOrbsFinality(ethereum, orbs) {
    const currentBlock = await ethereum.getLatestBlock();

    await ethereum.waitForBlock(currentBlock.number + orbs.finalityCompBlocks);
    await sleep(orbs.finalityCompSeconds * 1000);

    // advance orbs by one block - otherwise gamma doesn't close block and getEthereumBlockNumber in process fails to note ganache advanced
    // TODO check if this is really necessary
    return await advanceByOneBlock(orbs);
}

async function deployVotingContractToOrbs(orbs, contractName) {
    const b = fs.readFileSync("./../../orbs/OrbsVoting/orbs_voting_contract.go");
    const contractCode = new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    const signer = orbs.accounts[0];
    const [t, txid] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(contractCode)]);
    return await orbs.client.sendTransaction(t);
}

async function setVotingContractParams(orbs, contractName, votingMirrorPeriod, votingValidityPeriod, electionsPeriod, maxElected, minElected, erc20, guardians, validators, validatorsRegistry, voting) {
    const signer = orbs.accounts[0];
    const arguments = [];
    let result;
    let t;
    arguments.push(Orbs.argUint64(votingMirrorPeriod));
    arguments.push(Orbs.argUint64(votingValidityPeriod));
    arguments.push(Orbs.argUint64(electionsPeriod));
    arguments.push(Orbs.argUint32(maxElected));
    arguments.push(Orbs.argUint32(minElected));

    [t] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, contractName, "unsafetests_setVariables", arguments);
    result = await orbs.client.sendTransaction(t);
    expect(result).to.be.successful;

    [t] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, contractName, "unsafetests_setVotingEthereumContractAddress", [Orbs.argString(voting.address)]);
    result = await orbs.client.sendTransaction(t);
    expect(result).to.be.successful;

    [t] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, contractName, "unsafetests_setGuardiansEthereumContractAddress", [Orbs.argString(guardians.address)]);
    result = await orbs.client.sendTransaction(t);
    expect(result).to.be.successful;

    [t] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, contractName, "unsafetests_setTokenEthereumContractAddress", [Orbs.argString(erc20.address)]);
    result = await orbs.client.sendTransaction(t);
    expect(result).to.be.successful;

    [t] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, contractName, "unsafetests_setValidatorsEthereumContractAddress", [Orbs.argString(validators.address)]);
    result = await orbs.client.sendTransaction(t);
    expect(result).to.be.successful;

    [t] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, contractName, "unsafetests_setValidatorsRegistryEthereumContractAddress", [Orbs.argString(validatorsRegistry.address)]);
    result = await orbs.client.sendTransaction(t);
    expect(result).to.be.successful;

}

function goodSamaritanMirrorsAll(orbsVotingContractName, erc20, voting, electionBlockNumber) {
    return new Promise((resolve, reject) => {
        const child = spawn("node", [path.resolve("..", "..", "processor", "mirror.js")], {
            env: {
                "ORBS_VOTING_CONTRACT_NAME": orbsVotingContractName,
                "ERC20_CONTRACT_ADDRESS": erc20.address,
                "VOTING_CONTRACT_ADDRESS": voting.address,
                "START_BLOCK_ON_ETHEREUM": 0, //TODO change for ropsten/mainnet
                "END_BLOCK_ON_ETHEREUM": electionBlockNumber,
                "VERBOSE": true,
                "NETWORK_URL_ON_ETHEREUM": "localhost:7545", //TODO change for ropsten/mainnet
                "ORBS_ENVIRONMENT": "experimental", //TODO change for other networks,
                path: process.env.path
            },
            stdio: [process.stdin, "pipe", process.stderr]
        });

        child.on("error", e => reject(e));

        child.on("close", code => {
            if (code !== 0) {
                reject(`Mirror script returned exit code ${code}`);
            } else {
                resolve();
            }
        })
    });
}

async function goodSamaritanProcessesAll() {

}

function getElectionWinners(whisperedResult) {
    return whisperedResult;
}

async function setElectionBlockNumber(ethereum, orbs, orbsVotingContractName) {
    const currentBlock = await ethereum.getLatestBlock();

    const signer = orbs.accounts[0];
    const electionBlock = currentBlock.number + 1;

    const [t] = orbs.client.createTransaction(signer.publicKey, signer.privateKey, orbsVotingContractName, "unsafetests_setElectedBlockNumber", [Orbs.argUint64(electionBlock)]);
    await orbs.client.sendTransaction(t);

    console.log(`Next election block number set to ${electionBlock}`);

    return electionBlock;
}

describe("voting contracts on orbs and ethereum", async () => {

    it("perform elections to determine the active validators", async () => {
        const ethereum = await EthereumAdapter.build();
        const orbs = await OrbsAdapter.build();

        // deploy ERC20:
        const erc20 = await ethereum.deploySolidityContract({from: ethereum.accounts[0]}, 'TestingERC20', "build/contracts");
        console.log("ERC20 contract at", erc20.address);

        // deploy ethereum Voting:
        const maxVoteOut = 3;
        const voting = await ethereum.deploySolidityContract({from: ethereum.accounts[0]}, 'OrbsVoting', "build/contracts", maxVoteOut);
        console.log("Voting contract at", voting.address);

        // deploy ethereum Validators:
        const validatorsRegistry = await ethereum.deploySolidityContract({from: ethereum.accounts[0]}, 'OrbsValidatorsRegistry', "build/contracts");
        console.log("ValidatorsRegistry contract at", validatorsRegistry.address);

        // deploy ethereum Validators:
        const validatorsLimit = 20;
        const validators = await ethereum.deploySolidityContract({from: ethereum.accounts[0]}, 'OrbsValidators', "build/contracts", validatorsRegistry.address, validatorsLimit);
        console.log("Validators contract at", validators.address);

        // deploy ethereum Guardians:
        const minRegistrationSeconds = 0;
        const guardianWeiDeposit = helpers.getWeiDeposit(ethereum.web3);
        const guardians = await ethereum.deploySolidityContract({from: ethereum.accounts[0]}, 'OrbsGuardians', "build/contracts", guardianWeiDeposit, minRegistrationSeconds);
        console.log("Guardians contract at", guardians.address);


        // Deploy Orbs voting contract
        const orbsVotingContractName = `OrbsVoting_${new Date().getTime()}`;
        const orbsVotingContractDeploymentResult = await deployVotingContractToOrbs(orbs, orbsVotingContractName);
        expect(orbsVotingContractDeploymentResult).to.be.successful;
        console.log("deployed Orbs voting contract", orbsVotingContractName);

        // set voting contract params
        // TODO - why are these variables set after construction? are they really variables or constants??
        const votingMirrorPeriod = 10;
        const votingValidityPeriod = 500;
        const electionsPeriod = 200;
        const maxElected = 5;
        const minElected = 3;
        await setVotingContractParams(orbs, orbsVotingContractName, votingMirrorPeriod, votingValidityPeriod, electionsPeriod, maxElected, minElected, erc20, guardians, validators, validatorsRegistry, voting);
        console.log("initialized Orbs voting contract params");

        const shf = new StakeHolderFactory(ethereum.web3, ethereum.accounts, erc20, validators, validatorsRegistry, guardians, voting);

        const v1 = await shf.aValidator({stake: 10000});
        const v2 = await shf.aValidator({stake: 20000});
        const v3 = await shf.aValidator({stake: 15000});
        const v4 = await shf.aValidator({stake: 5000});
        const v5 = await shf.aValidator({stake: 7000});

        // sanity - all validators are listed in both contracts
        const orbsValidatorAddresses = await Promise.all((await validators.getValidators()).map(vAddr => validatorsRegistry.getOrbsAddress(vAddr)));
        expect(orbsValidatorAddresses.map(a => a.toLowerCase())).to.have.members([v1, v2, v3, v4, v5].map(v => v.orbsAccount.address.toLowerCase()));

        const g1 = await shf.aGuardian({stake: 6000});
        const g2 = await shf.aGuardian({stake: 34000});
        const g3 = await shf.aGuardian({stake: 5000});
        const g4 = await shf.aGuardian({stake: 0});

        // TODO verify registration?

        const d0 = await shf.aDelegator({stake: 10000});
        const d1 = await shf.aDelegator({stake: 10000});
        const d2 = await shf.aDelegator({stake: 8000});
        const d3 = await shf.aDelegator({stake: 8000});
        const d4 = await shf.aDelegator({stake: 6000});
        const d5 = await shf.aDelegator({stake: 6000});
        const d6 = await shf.aDelegator({stake: 34000});
        const d7 = await shf.aDelegator({stake: 0});
        const d8 = await shf.aDelegator({stake: 20000});
        const d9 = await shf.aDelegator({stake: 5000});

        await shf.waitForFundingSuccess();
        const DELEGATE_AMOUNT = ethereum.web3.utils.toBN("70000000000000000");

        await d0.transferTo(d6, DELEGATE_AMOUNT);
        await d2.transferTo(d6, DELEGATE_AMOUNT);
        await d5.transferTo(d3, DELEGATE_AMOUNT);
        await d8.transferTo(d4, 50);
        await d8.transferTo(d4, DELEGATE_AMOUNT);
        await d8.transferTo(d1, 10);
        await d3.transferTo(g3, DELEGATE_AMOUNT);
        await d9.transferTo(g3, DELEGATE_AMOUNT);
        await d1.transferTo(d6, DELEGATE_AMOUNT);
        await d2.transferTo(d4, DELEGATE_AMOUNT);
        await d8.transferTo(d6, DELEGATE_AMOUNT);
        await d5.transferTo(d9, 10);

        // TODO verify transfers

        await d1.delegateExplicitly(d4);
        await d7.delegateExplicitly(g3);

        // TODO verify delegation in contract state

        await g1.voteOut(v1, v3);
        await g3.voteOut(v3, v4, v5);
        await g2.voteOut(v3);
        await g1.voteOut(v2); // second vote
        await g4.voteOut();
        await d2.voteOut(v5, v2, v3); // not an guardian

        // TODO verify that all this voting and delegating happened before the first election period begins to that they count for the next election:
        // if config.FirstElectionBlockNumber != 0 {
        //     currentBlock := ethereum.GetCurrentBlock()
        //     require.True(t, currentBlock < config.FirstElectionBlockNumber, "Recorded activity will not be included in the current election period")
        // }
        const nextElectionBlockNumber = await setElectionBlockNumber(ethereum, orbs, orbsVotingContractName);

        await waitForOrbsFinality(ethereum, orbs);

        await goodSamaritanMirrorsAll(orbsVotingContractName, erc20, voting, nextElectionBlockNumber);

        await goodSamaritanProcessesAll();

        const winners = getElectionWinners([v1, v2, v3, v4]);
        expect(winners).to.have.members([v1, v2, v3, v4]); // TODO - which should be voted in???

        // XXXX end of flow. gamma does not enforce the results of elections on validator committee. it requies an "unsafe_" operation. consider supporting


        ethereum.stop();
    })
});

class StakeHolderFactory {
    constructor(web3, accounts, erc20, validators, validatorsRegistry, guardians, voting) {
        this.erc20 = erc20;
        this.nextStakeHolderIndex = 0;
        this.web3 = web3;
        this.accounts = accounts;
        this.fundingPromises = [];
        this.validators = validators;
        this.validatorsRegistry = validatorsRegistry;
        this.guardians = guardians;
        this.voting = voting;
    }

    async aValidator({stake}) {
        const i = this.nextStakeHolderIndex;
        const owner = this.accounts[0];
        const v = await this.initStakeHolder({stake});
        v.orbsAccount = Orbs.createAccount();
        await this.validators.approve(v.address, {from: owner});
        console.log("approved validator", v.address);

        await this.validatorsRegistry.register(`Validator ${i}`, ipToHexaBytes(`10.0.0.${i}`), `https://www.validator${i}.com`, v.orbsAccount.address, {from: v.address});
        console.log("registered validator", v.address);
        return v;
    }

    async aGuardian({stake}) {
        const i = this.nextStakeHolderIndex;
        const g = await this.initStakeHolder({stake});

        await this.guardians.register(`guardianName${i}`, `https://www.guardian${i}.com`, {from: g.address, value: helpers.getWeiDeposit(this.web3)});
        console.log("registered guardian", g.address);

        return g;
    }

    async aDelegator({stake}) {
        return this.initStakeHolder({stake});
    }

    async waitForFundingSuccess() {
        await Promise.all(this.fundingPromises);
        this.fundingPromises = [];
        console.log("initial stakes assigned");
    }

    async initStakeHolder({stake}) {
        const sh = new StakeHolder({
            web3: this.web3,
            erc20: this.erc20,
            address: this.accounts[this.nextStakeHolderIndex++],
            initialStake: stake,
            voting: this.voting
        });
        const amountBN = this.web3.utils.toBN(stake).mul(this.web3.utils.toBN("1000000000000000000"));

        const fundAndVerifyPromise = (async () => {
            await this.erc20.assign(sh.address, amountBN, {from: sh.address});
            const balance = await this.erc20.balanceOf(sh.address);
            expect(balance.toString()).to.equal(amountBN.toString());
            console.log(`funded ${sh.address} with ${amountBN.toString()}`);
        })();

        this.fundingPromises.push(fundAndVerifyPromise);
        return sh;
    }
}


class StakeHolder {
    constructor({web3, erc20, voting, address, initialStake}) {
        this.address = address;
        this.initialStake = initialStake;
        this.erc20 = erc20;
        this.web3 = web3;
        this.voting = voting;
    }

    async transferTo(toStakeHolder, amount) {
        if (!this.web3.utils.isBN(amount)) {
            amount = this.web3.utils.toBN(amount).mul(this.web3.utils.toBN("1000000000000000000"));
        }
        await this.erc20.transfer(toStakeHolder.address, amount, {from: this.address});
        console.log(`transferred ${amount.toString()} Orbs from ${this.address} to ${toStakeHolder.address}`)
    };

    async delegateExplicitly(to) {
        await this.voting.delegate(to.address, {from: this.address});
        console.log('delegated explicitly to', to.address);
    }

    async voteOut(...validators) {
        const addressesToVoteOut = validators.map(v => v.address);
        await this.voting.voteOut(addressesToVoteOut, {from: this.address});
        console.log(`StakeHolder ${this.address} voted out addresses ${addressesToVoteOut}`);
    }
}

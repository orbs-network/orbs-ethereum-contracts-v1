const helpers = require('./helpers');
const fs = require("fs");
const Orbs = require("orbs-client-sdk");
const {expect, use} = require("chai");
const { spawn } = require("child_process");
const path = require("path");

const {orbsAssertions} = require("psilo");
use(orbsAssertions);

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

class ElectionContracts {
    constructor(ethereum, orbs, ethereumUrl, options) {
        this.ethereum = ethereum;
        this.options = options;
        this.orbs = orbs;
        this.ethereumUrl = ethereumUrl;
    }

    newStakeHolderFactory() {
        return new StakeHolderFactory(this.ethereum.web3, this.ethereum.accounts, this.erc20, this.validators, this.validatorsRegistry, this.guardians, this.voting);
    }

    async deploy() {
        //TODO parallelize whatever we can
        const signer = {from: this.ethereum.accounts[0]};
        const votingContractsBuildDir = "../../ethereum/build/contracts";

        this.erc20 = await this.ethereum.deploySolidityContract(signer, 'TestingERC20', "build/contracts");
        console.log("ERC20 contract at", this.erc20.address);

        this.voting = await this.ethereum.deploySolidityContract(signer, 'OrbsVoting', votingContractsBuildDir, this.options.maxVoteOut);
        console.log("Voting contract at", this.voting.address);

        this.validatorsRegistry = await this.ethereum.deploySolidityContract(signer, 'OrbsValidatorsRegistry', votingContractsBuildDir);
        console.log("ValidatorsRegistry contract at", this.validatorsRegistry.address);

        this.validators = await this.ethereum.deploySolidityContract(signer, 'OrbsValidators', votingContractsBuildDir, this.validatorsRegistry.address, this.options.validatorsLimit);
        console.log("Validators contract at", this.validators.address);

        const guardianWeiDeposit = helpers.getWeiDeposit(this.ethereum.web3);
        this.guardians = await this.ethereum.deploySolidityContract(signer, 'OrbsGuardians', votingContractsBuildDir, guardianWeiDeposit, this.options.minRegistrationSeconds);
        console.log("Guardians contract at", this.guardians.address);

        // Deploy Orbs voting contract
        expect(await this._deployVotingContractToOrbs()).to.be.successful;
        console.log("deployed Orbs voting contract", this.orbsVotingContractName);

        // set voting contract params
        // TODO - why are these variables set after construction? are they really variables or constants??
        await this._setVotingContractParams();
        console.log("initialized Orbs voting contract params");

    }

    async _deployVotingContractToOrbs() {
        this.orbsVotingContractName = `OrbsVoting_${new Date().getTime()}`;

        const b = fs.readFileSync("./../../orbs/OrbsVoting/orbs_voting_contract.go");
        const contractCode = new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
        const signer = this.orbs.accounts[0];
        return this.orbs.contract("_Deployments").transact(signer, "deployService", Orbs.argString(this.orbsVotingContractName), Orbs.argUint32(1), Orbs.argBytes(contractCode));
    }

    async _setVotingContractParams() {
        const signer = this.orbs.accounts[0];
        const contract = this.orbs.contract(this.orbsVotingContractName);

        const args = [];
        args.push(Orbs.argUint64(this.options.votingMirrorPeriod));
        args.push(Orbs.argUint64(this.options.votingValidityPeriod));
        args.push(Orbs.argUint64(this.options.electionsPeriod));
        args.push(Orbs.argUint32(this.options.maxElected));
        args.push(Orbs.argUint32(this.options.minElected));

        //TODO parallelize
        expect(await contract.transact(signer, "unsafetests_setVariables", ...args)).to.be.successful;
        expect(await contract.transact(signer, "unsafetests_setVotingEthereumContractAddress", Orbs.argString(this.voting.address))).to.be.successful;
        expect(await contract.transact(signer, "unsafetests_setGuardiansEthereumContractAddress", Orbs.argString(this.guardians.address))).to.be.successful;
        expect(await contract.transact(signer, "unsafetests_setTokenEthereumContractAddress", Orbs.argString(this.erc20.address))).to.be.successful;
        expect(await contract.transact(signer, "unsafetests_setValidatorsEthereumContractAddress", Orbs.argString(this.validators.address))).to.be.successful;
        expect(await contract.transact(signer, "unsafetests_setValidatorsRegistryEthereumContractAddress", Orbs.argString(this.validatorsRegistry.address))).to.be.successful;

    }

    async getOrbsValidatorAddresses() {
        const validators = await this.validators.getValidators();
        return Promise.all(validators.map(vAddr => this.validatorsRegistry.getOrbsAddress(vAddr)));
    }


    async setElectionBlockNumber() {
        const currentBlock = await this.ethereum.getLatestBlock();
        const electionBlock = currentBlock.number + 1;

        await this.orbs.contract(this.orbsVotingContractName).transact(this.orbs.accounts[0], "unsafetests_setElectedBlockNumber", Orbs.argUint64(electionBlock));

        console.log(`Next election block number set to ${electionBlock}`);

        return electionBlock;
    }

    async waitForOrbsFinality(blockToWaitFor) {
        blockToWaitFor = blockToWaitFor || await this.ethereum.getLatestBlock().number;
        console.log(`waiting for block ${blockToWaitFor} to reach finality...`);

        // finality - block component
        await this.ethereum.waitForBlock(blockToWaitFor + this.orbs.finalityCompBlocks);

        // finality - time component
        await sleep(this.orbs.finalityCompSeconds * 1000);
        const result = await advanceByOneBlock(this.orbs); // applies finality time component by advancing Orbs clock.

        // verify finality achieved
        const currentFinalQueryResult = await this.orbs.contract(this.orbsVotingContractName).query(this.orbs.accounts[0], "getCurrentEthereumBlockNumber");
        expect(currentFinalQueryResult).to.be.successful;
        const currentFinalityBlockNumber = Number(currentFinalQueryResult.outputArguments[0].value);

        expect(currentFinalityBlockNumber).to.be.gte(blockToWaitFor);
        console.log(`finality reached for block ${currentFinalityBlockNumber}`);

        return result;
    }

    async getElectionWinners() {
        const response = await this.orbs.contract(this.orbsVotingContractName).query(this.orbs.accounts[0], "getElectedValidatorsOrbsAddress")
        expect(response).to.be.successful;
        const rawOutput = response.outputArguments[0].value;
        const addressLength = 20;

        const numOfValidators = rawOutput.length / addressLength;
        const rawWinners = [];
        for (let i = 0; i < numOfValidators; i++) {
            const start = i * addressLength;
            const end = start + addressLength;
            rawWinners.push(new Uint8Array(rawOutput.slice(start, end)));
        }

        return rawWinners.map(addr => Orbs.encodeHex(addr));
    }


    //TODO make mirror.js an exported function of the 'processor' module and run in same process
    goodSamaritanMirrorsAll(electionBlockNumber) {
        return new Promise((resolve, reject) => {
            const child = spawn("node", ["mirror.js"], {
                env: {
                    "ERC20_CONTRACT_ADDRESS": this.erc20.address,
                    "VOTING_CONTRACT_ADDRESS": this.voting.address,
                    "START_BLOCK_ON_ETHEREUM": 1, //TODO change for ropsten/mainnet
                    "END_BLOCK_ON_ETHEREUM": electionBlockNumber,
                    "VERBOSE": true,
                    "NETWORK_URL_ON_ETHEREUM": this.ethereumUrl,
                    "ORBS_URL": process.env.GAMMA_URL || "http://localhost:8080", //TODO change for other networks,
                    "ORBS_VCHAINID": process.env.GAMMA_VCHAIN || 42, //TODO change for other networks,
                    "ORBS_VOTING_CONTRACT_NAME": this.orbsVotingContractName,
                    PATH: process.env.PATH
                },
                stdio: "inherit",
                cwd: path.resolve("..", "..", "processor"),
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

    goodSamaritanProcessesAll() {
        return new Promise((resolve, reject) => {
            const child = spawn("node", ["process.js"], {
                env: {
                    "VERBOSE": true,
                    "ORBS_URL": process.env.GAMMA_URL || "http://localhost:8080", //TODO change for other networks,
                    "ORBS_VCHAINID": process.env.GAMMA_VCHAIN || 42, //TODO change for other networks,
                    "ORBS_VOTING_CONTRACT_NAME": this.orbsVotingContractName,
                    PATH: process.env.PATH
                },
                stdio: "inherit",
                cwd: path.resolve("..", "..", "processor"),
            });

            child.on("error", e => reject(e));

            child.on("close", code => {
                if (code !== 0) {
                    reject(`Process script returned exit code ${code}`);
                } else {
                    resolve();
                }
            })
        });
    }

}


function ipToHexaBytes(ip) {
    const decimalElements = ip.split(".");

    expect(decimalElements).to.be.length(4);
    const twoDigitHexElements = decimalElements.map(e => ('0' + parseInt(e).toString(16)).slice(-2));

    return `0x${twoDigitHexElements.join('')}`
}

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function advanceByOneBlock(orbs) {
    return await orbs.contract("_Info").transact(orbs.accounts[0], "isAlive");
}


module.exports = {ElectionContracts};

const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));
const expect = chai.expect;

const GUARD = 1234;
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

class Driver {

    constructor(accounts, pos, erc20, staking, guard) {
        this.pos = pos;
        this.erc20 = erc20;
        this.staking = staking;
        this.accounts = accounts;
        this.validators = [];

        if (guard != GUARD) {
            throw new Error("private constructor called externally")
        }
    }

    static async new(maxCommitteeSize) {
        maxCommitteeSize = maxCommitteeSize || 2;

        const accounts = await web3.eth.getAccounts();
        const pos = await artifacts.require("PosV2").new(maxCommitteeSize);
        const erc20 = await artifacts.require('TestingERC20').new();
        const staking = await artifacts.require("StakingContract").new(1 /* _cooldownPeriodInSec */, "0x0000000000000000000000000000000000000001" /* _migrationManager */, "0x0000000000000000000000000000000000000001" /* _emergencyManager */, pos.address /* IStakingListener */, erc20.address /* _token */);

        await pos.setStakingContract(staking.address);

        return new Driver(accounts, pos, erc20, staking, GUARD);
    }

    get contractsOwner() {
        return this.accounts[0];
    }

    get contractsNonOwner() {
        return this.accounts[1];
    }

    newValidator() {
        const v = new Validator(this.accounts[this.validators.length], this);
        this.validators.push(v);
        return v
    }

    committeeChangedEvents(txResult) {
        const inputs = this.pos.abi.find(e => e.name == "CommitteeChanged").inputs;
        const eventSignature = "CommitteeChanged(address[],uint256[])";

        return this._parseEvents(txResult, inputs, eventSignature)
    }

    validatorRegisteredEvents(txResult) {
        const inputs = this.pos.abi.find(e => e.name == "ValidatorRegistered").inputs;
        const eventSignature = "ValidatorRegistered(address,bytes4)";

        return this._parseEvents(txResult, inputs, eventSignature)
    }

    stakedEvents(txResult) {
        const inputs = this.staking.abi.find(e => e.name == "Staked").inputs;
        const eventSignature = "Staked(address,uint256,uint256)";

        return this._parseEvents(txResult, inputs, eventSignature)
    }

    _parseEvents(txResult, inputs, eventSignature) {
        const eventSignatureHash = web3.eth.abi.encodeEventSignature(eventSignature);
        return txResult.receipt.rawLogs
            .filter(rl => rl.topics[0] === eventSignatureHash)
            .map(rawLog => web3.eth.abi.decodeLog(inputs, rawLog.data, rawLog.topics.slice(1) /*assume all events are non-anonymous*/));
    }

}

class Validator {

    constructor(address, driver) {
        this.ip = address.substring(0, 10).toLowerCase();

        this.address = address;
        this.erc20 = driver.erc20;
        this.staking = driver.staking;
    }

    async stake(amount) {
        await this.erc20.assign(this.address, amount);
        await this.erc20.approve(this.staking.address, amount, {from: this.address});
        return await this.staking.stake(amount, {from: this.address});
    }

}

function expectBNArrayEqual(a1, a2) {
    expect(a1).to.be.length(a2.length);
    a1.forEach((v, i) => {
        expect(new BN(a1[i])).to.be.bignumber.equal(new BN(a2[i]));
    });
}

async function expectRejected(promise, msg) {
    try {
        await promise;
    } catch (err) {
        // TODO verify correct error
        return
    }
    throw new Error(msg || "expected promise to reject")
}

module.exports = {
    Driver,
    expectBNArrayEqual,
    expectRejected,
    ZERO_ADDR
};

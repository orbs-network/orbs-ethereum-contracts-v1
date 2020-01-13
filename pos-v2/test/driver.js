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
        this.participants = [];

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

    newParticipant() {
        const v = new Participant(this.accounts[this.participants.length], this);
        this.participants.push(v);
        return v
    }

    async delegateMoreStake(amount, delegatee) {
        const delegator = this.newParticipant();
        await delegator.stake(new BN(amount));
        return await delegator.delegate(delegatee);
    }
}

class Participant {

    constructor(address, driver) {
        this.ip = address.substring(0, 10).toLowerCase();

        this.address = address;
        this.erc20 = driver.erc20;
        this.staking = driver.staking;
        this.pos = driver.pos;
    }

    async stake(amount) {
        const bnAmount = new BN(amount);
        await this.erc20.assign(this.address, bnAmount);
        await this.erc20.approve(this.staking.address, bnAmount, {from: this.address});
        return this.staking.stake(bnAmount, {from: this.address});
    }

    async delegate(to) {
        return this.pos.delegate(to.address, {from: this.address});
    }

    async registerAsValidator() {
        return await this.pos.registerValidator(this.ip, {from: this.address});
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

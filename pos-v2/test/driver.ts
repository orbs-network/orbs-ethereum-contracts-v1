import BN from "bn.js";
import chai from "chai";
chai.use(require('chai-bn')(BN));
const expect = chai.expect;

export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

import Web3 from "web3";
declare const web3: Web3;

export class Driver {
    private participants: Participant[] = [];

    constructor(
        public accounts,
        public pos,
        public erc20,
        public staking,
        public subscriptions) {}

    static async new(maxCommitteeSize=2) {
        const accounts = await web3.eth.getAccounts();
        const pos = await artifacts.require("PosV2").new(maxCommitteeSize);
        const erc20 = await artifacts.require('TestingERC20').new();
        const staking = await artifacts.require("StakingContract").new(1 /* _cooldownPeriodInSec */, "0x0000000000000000000000000000000000000001" /* _migrationManager */, "0x0000000000000000000000000000000000000001" /* _emergencyManager */, pos.address /* IStakingListener */, erc20.address /* _token */);
        const subscriptions = await artifacts.require('Subscriptions').new();

        await pos.setStakingContract(staking.address);

        return new Driver(accounts, pos, erc20, staking, subscriptions);
    }

    get contractsOwner() {
        return this.accounts[0];
    }

    get contractsNonOwner() {
        return this.accounts[1];
    }

    async newSubscriber(tier, monthlyRate) {
        const subscriber = await artifacts.require('MonthlySubscriptionPlan').new(this.subscriptions.address, tier, monthlyRate);
        await this.subscriptions.addSubscriber(subscriber.address);
        return subscriber;
    }

    newParticipant(): Participant {
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

export class Participant {
    public ip: string;
    private erc20;
    private staking;
    private pos;

    constructor(public address: string, driver) {
        this.ip = address.substring(0, 10).toLowerCase();
        this.erc20 = driver.erc20;
        this.staking = driver.staking;
        this.pos = driver.pos;
    }

    async stake(amount: number|BN) {
        const bnAmount = new BN(amount);
        await this.erc20.assign(this.address, bnAmount);
        await this.erc20.approve(this.staking.address, bnAmount, {from: this.address});
        return this.staking.stake(bnAmount, {from: this.address});
    }

    async delegate(to: Participant) {
        return this.pos.delegate(to.address, {from: this.address});
    }

    async registerAsValidator() {
        return await this.pos.registerValidator(this.ip, {from: this.address});
    }
}

export function expectBNArrayEqual(a1, a2) {
    expect(a1).to.be.length(a2.length);
    a1.forEach((v, i) => {
        expect(new BN(a1[i])).to.be.bignumber.equal(new BN(a2[i]));
    });
}

export async function expectRejected(promise: Promise<any>, msg?: string) {
    try {
        await promise;
    } catch (err) {
        // TODO verify correct error
        return
    }
    throw new Error(msg || "expected promise to reject")
}


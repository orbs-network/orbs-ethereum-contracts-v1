import BN from "bn.js";
import chai from "chai";
chai.use(require('chai-bn')(BN));
const expect = chai.expect;

export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

import Web3 from "web3";
import ElectionsContract = Contracts.ElectionsContract;
import ERC20Contract = Contracts.ERC20Contract;
import StakingContract = Contracts.StakingContract;
import SubscriptionsContract = Contracts.SubscriptionsContract;
import MonthlySubscriptionContract = Contracts.MonthlySubscriptionPlanContract;
import RewardsContract = Contracts.RewardsContract;
declare const web3: Web3;

export class Driver {
    private participants: Participant[] = [];

    constructor(
        public accounts: string[],
        public elections: ElectionsContract,
        public erc20: ERC20Contract,
        public staking: StakingContract,
        public subscriptions: SubscriptionsContract,
        public rewards: RewardsContract
    ) {}

    static async new(maxCommitteeSize=2, minimumStake:number|BN=100) {
        const accounts = await web3.eth.getAccounts();
        const erc20 = await artifacts.require('TestingERC20').new();
        const rewards = await artifacts.require('Rewards').new(erc20.address);
        const subscriptions = await artifacts.require('Subscriptions').new(rewards.address, erc20.address);
        const pos = await artifacts.require("Elections").new(maxCommitteeSize, minimumStake, rewards.address /* committee listener */);
        const staking = await artifacts.require("StakingContract").new(1 /* _cooldownPeriodInSec */, "0x0000000000000000000000000000000000000001" /* _migrationManager */, "0x0000000000000000000000000000000000000001" /* _emergencyManager */, pos.address /* IStakingListener */, erc20.address /* _token */);

        await rewards.setCommitteeProvider(pos.address);
        await rewards.setStakingContract(staking.address);
        await pos.setStakingContract(staking.address);

        return new Driver(accounts, pos, erc20, staking, subscriptions, rewards);
    }

    get contractsOwner() {
        return this.accounts[0];
    }

    get contractsNonOwner() {
        return this.accounts[1];
    }

    async newSubscriber(tier: string, monthlyRate:number|BN): Promise<MonthlySubscriptionContract> {
        const subscriber = await artifacts.require('MonthlySubscriptionPlan').new(this.subscriptions.address, this.erc20.address, tier, monthlyRate);
        await this.subscriptions.addSubscriber(subscriber.address);
        return subscriber;
    }

    newParticipant(): Participant { // consumes two addresses from accounts for each participant - ethereum address and an orbs address
        const v = new Participant(this.accounts[this.participants.length*2], this.accounts[this.participants.length*2+1], this);
        this.participants.push(v);
        return v
    }

    async delegateMoreStake(amount:number|BN, delegatee: Participant) {
        const delegator = this.newParticipant();
        await delegator.stake(new BN(amount));
        return await delegator.delegate(delegatee);
    }
}

export class Participant {
    public ip: string;
    private erc20: ERC20Contract;
    private staking: StakingContract;
    private elections: ElectionsContract;

    constructor(public address: string, public orbsAddress: string, driver: Driver) {
        this.ip = address.substring(0, 10).toLowerCase();
        this.erc20 = driver.erc20;
        this.staking = driver.staking;
        this.elections = driver.elections;
    }

    async stake(amount: number|BN) {
        await this.erc20.assign(this.address, amount);
        await this.erc20.approve(this.staking.address, amount, {from: this.address});
        return this.staking.stake(amount, {from: this.address});
    }

    async unstake(amount: number|BN) {
        return this.staking.unstake(amount);
    }

    async delegate(to: Participant) {
        return this.elections.delegate(to.address, {from: this.address});
    }

    async registerAsValidator() {
        return await this.elections.registerValidator(this.ip, this.orbsAddress, {from: this.address});
    }
}

export function expectBNArrayEqual(a1: Array<any>, a2: Array<any>) {
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


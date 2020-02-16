import BN from "bn.js";
import chai from "chai";
chai.use(require('chai-bn')(BN));
import { Contract } from 'web3-eth-contract';

export const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

import Web3 from "web3";
import { SubscriptionsContract } from "../typings/subscriptions-contract";
import { ElectionsContract } from "../typings/elections-contract";
import { ERC20Contract } from "../typings/erc20-contract";
import { StakingContract } from "../typings/staking-contract";
import { RewardsContract } from "../typings/rewards-contract";
import { MonthlySubscriptionPlanContract } from "../typings/monthly-subscription-plan-contract";
import {ContractRegistryContract} from "../typings/contract-registry-contract";
declare const web3: Web3;

export const DEFAULT_MINIMUM_STAKE = 100;
export const DEFAULT_COMMITTEE_SIZE = 2;
export const DEFAULT_TOPOLOGY_SIZE = 3;
export const DEFAULT_MAX_DELEGATION_RATIO = 10;
export const DEFAULT_VOTE_OUT_THRESHOLD = 80;
export const DEFAULT_VOTE_OUT_TIMEOUT = 24*60*60;

export class Driver {
    private participants: Participant[] = [];

    constructor(
        public accounts: string[],
        public elections: ElectionsContract,
        public erc20: ERC20Contract,
        public externalToken: ERC20Contract,
        public staking: StakingContract,
        public subscriptions: SubscriptionsContract,
        public rewards: RewardsContract
    ) {}

    static async new(maxCommitteeSize=DEFAULT_COMMITTEE_SIZE, maxTopologySize=DEFAULT_TOPOLOGY_SIZE, minimumStake:number|BN=DEFAULT_MINIMUM_STAKE, maxDelegationRatio=DEFAULT_MAX_DELEGATION_RATIO, voteOutThreshold=DEFAULT_VOTE_OUT_THRESHOLD, voteOutTimeout=DEFAULT_VOTE_OUT_TIMEOUT) {
        const accounts = await web3.eth.getAccounts();
        const erc20 = await artifacts.require('TestingERC20').new();
        const externalToken = await artifacts.require('TestingERC20').new();
        const rewards = await artifacts.require('Rewards').new(erc20.address, externalToken.address, accounts[0]);
        const subscriptions = await artifacts.require('Subscriptions').new(rewards.address, erc20.address);
        const elections = await artifacts.require("Elections").new(maxCommitteeSize, maxTopologySize, minimumStake, maxDelegationRatio, voteOutThreshold, voteOutTimeout, rewards.address /* committee listener */);
        const staking = await artifacts.require("StakingContract").new(1 /* _cooldownPeriodInSec */, "0x0000000000000000000000000000000000000001" /* _migrationManager */, "0x0000000000000000000000000000000000000001" /* _emergencyManager */, elections.address /* IStakingListener */, erc20.address /* _token */);

        await rewards.setCommitteeProvider(elections.address);
        await rewards.setStakingContract(staking.address);
        await elections.setStakingContract(staking.address);

        return new Driver(accounts, elections, erc20, externalToken, staking, subscriptions, rewards);
    }

    static async newContractRegistry(governorAddr: string): Promise<ContractRegistryContract> {
        return artifacts.require('ContractRegistry').new(governorAddr);
    }

    get contractsOwner() {
        return this.accounts[0];
    }

    get contractsNonOwner() {
        return this.accounts[1];
    }

    get rewardsGovernor(): Participant {
        return new Participant(this.accounts[0], this.accounts[0], this);
    }

    async newSubscriber(tier: string, monthlyRate:number|BN): Promise<MonthlySubscriptionPlanContract> {
        const subscriber = await artifacts.require('MonthlySubscriptionPlan').new(this.subscriptions.address, this.erc20.address, tier, monthlyRate);
        await this.subscriptions.addSubscriber(subscriber.address);
        return subscriber;
    }

    newParticipant(): Participant { // consumes two addresses from accounts for each participant - ethereum address and an orbs address
        const RESERVED_ACCOUNTS = 2;
        const v = new Participant(this.accounts[RESERVED_ACCOUNTS + this.participants.length*2], this.accounts[RESERVED_ACCOUNTS + this.participants.length*2+1], this);
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
    private externalToken: ERC20Contract;
    private staking: StakingContract;
    private elections: ElectionsContract;

    constructor(public address: string, public orbsAddress: string, driver: Driver) {
        this.ip = address.substring(0, 10).toLowerCase();
        this.erc20 = driver.erc20;
        this.externalToken = driver.externalToken;
        this.staking = driver.staking;
        this.elections = driver.elections;
    }

    async stake(amount: number|BN) {
        await this.assignAndApproveOrbs(amount, this.staking.address);
        return this.staking.stake(amount, {from: this.address});
    }

    private async assignAndApprove(amount: number|BN, to: string, token: ERC20Contract) {
        await token.assign(this.address, amount);
        await token.approve(to, amount, {from: this.address});
    }

    async assignAndApproveOrbs(amount: number|BN, to: string) {
        return this.assignAndApprove(amount, to, this.erc20);
    }

    async assignAndApproveExternalToken(amount: number|BN, to: string) {
        return this.assignAndApprove(amount, to, this.externalToken);
    }

    async unstake(amount: number|BN) {
        return this.staking.unstake(amount, {from: this.address});
    }

    async delegate(to: Participant) {
        return this.elections.delegate(to.address, {from: this.address});
    }

    async registerAsValidator() {
        return await this.elections.registerValidator(this.ip, this.orbsAddress, {from: this.address});
    }

    async notifyReadyForCommittee() {
        return await this.elections.notifyReadyForCommittee({from: this.orbsAddress});
    }
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


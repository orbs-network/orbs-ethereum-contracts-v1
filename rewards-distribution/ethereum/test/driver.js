

const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));
const expect = chai.expect;

const {RewardsClient} = require('../client/RewardsClient');

const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');
const OrbsRewardsDistributionForStaking = artifacts.require('./OrbsRewardsDistributionForStaking');

const StakingContract = artifacts.require('./StakingContract');

const ERC20 = artifacts.require('./TestingERC20');

// TODO use builder pattern to allow creation of batches and also to override batch content
module.exports = class Driver {
    constructor(owner, batchCount, batchSize) {
        this.owner = owner;
        const superset = this.generateRewardsSet(batchSize * batchCount);
        this.batches = [];
        this.batchHashes = [];
        while (superset.length) {
            const nextHashIdx = this.batchHashes.length;
            this.batches.push(superset.splice(0, batchSize));
            this.batchHashes.push(RewardsClient.hashBatch(nextHashIdx, this.batches[nextHashIdx]));
        }
    }

    generateRewardsSet(count) {
        const result = [];
        for (let i = 0; i < count; i++) {
            const addr = "0x" + (i + 1).toString(16).padStart(40, "0");
            result.push({address: addr, amount: i + 1});
        }
        return result;
    }

    static async newWithContracts(owner) {
        const d = new Driver(owner, 2, 5);
        d.erc20 = await ERC20.new();
        d.rewards = await OrbsRewardsDistribution.new(d.erc20.address, {from: owner});

        return d;
    }

    static async newWithContractsForStaking(owner) {
        const d = new Driver(owner, 2, 5);
        d.erc20 = await ERC20.new();
        d.staking = await StakingContract.new(1, owner, owner, d.erc20.address, {from: owner});
        d.rewards = await OrbsRewardsDistributionForStaking.new(d.staking.address, d.erc20.address, {from: owner});

        return d;
    }

    getRewardsContract() {
        return this.rewards;
    }

    async assignTokenToContract(amount) {
        return this.erc20.assign(this.rewards.address, amount);
    }

    async balanceOfContract() {
        return this.erc20.balanceOf(this.rewards.address);
    }

    async balanceOf(address) {
        return this.erc20.balanceOf(address);
    }

    async getStakeBalanceOf(address) {
        return this.staking.getStakeBalanceOf(address);
    }

    async getPastEvents(name, options) {
        return this.rewards.getPastEvents(name, options);
    }

    async getPendingBatches(distributionEvent) {
        return this.rewards.getPendingBatches(distributionEvent);
    }

    async abortDistributionEvent(distributionEvent) {
        return this.rewards.abortDistributionEvent(distributionEvent);
    }

    async announceDistributionEvent(distributionEvent, hashes, options) {
        if (hashes === undefined) {
            hashes = this.batchHashes;
        }
        options = Object.assign({from: this.owner}, options);
        return this.rewards.announceDistributionEvent(distributionEvent, hashes, options);
    }

    async executeBatch(distributionEvent, batchIndex, batch) {
        if (batch === undefined) {
            batch = this.batches[batchIndex];
        }
        return this.rewards.executeCommittedBatch(distributionEvent, batch.map(r => r.address), batch.map(r => r.amount), batchIndex);
    }

    async distributeRewards(distributionEvent, batchIndex, batch, options) {
        if (batch === undefined) {
            batch = this.batches[batchIndex];
        }
        options = Object.assign({from: this.rewardsDistributor}, options);

        return this.rewards.distributeRewards(distributionEvent, batch.map(r => r.address), batch.map(r => r.amount), options);
    }

    async setRewardsDistributor(address) {
        this.rewardsDistributor = address;
        await this.rewards.reassignRewardsDistributor(address, {from: this.owner});
        expect(await this.rewards.rewardsDistributor()).to.equal(address);
    }

    getTotalAmount() {
        const merged = [].concat(...this.batches);
        return merged.reduce((sum, reward) => sum + reward.amount, 0)
    }

    getBatchAmount(batchIndex) {
        return this.batches[batchIndex].reduce((sum, reward) => sum + reward.amount, 0)
    }
}

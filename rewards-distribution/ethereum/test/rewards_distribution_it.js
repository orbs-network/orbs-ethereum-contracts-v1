/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));
const expect = chai.expect;

const {expectRevert} = require('./assertExtensions');
const {parseBatches, hashBatch, announceRewards, executeBatches} = require('../client/distributionEvent');

const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');
const ERC20 = artifacts.require('./TestingERC20');

contract('OrbsRewardsDistribution', accounts => {
    const owner = accounts[0];

    describe('integration test - full flow', () => {

        it('full flow integration test - distributes rewards specified in rewards report', async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});
            let totalGasUsed = 0;

            const {rewardsToDistribute, batches, hashes} = await parseBatches(web3, "test/dummy_election.csv", 7);
            const totalAmount = batches.reduce((sum, b) => sum.add(b.reduce((sum, reward) => sum.add(new BN(reward.amount)), new BN(0))), new BN(0));

            const announcmentResult = await announceRewards(rewards, owner, distributionEvent, hashes);
            totalGasUsed += announcmentResult.receipt.gasUsed;

            const {pendingBatchHashes} = await rewards.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(hashes);

            // transfer tokens to contract
            await erc20.assign(rewards.address, totalAmount);

            expect(await erc20.balanceOf(rewards.address)).to.be.bignumber.equal(totalAmount);

            // execute all batches
            const firstBlockNumber = await web3.eth.getBlockNumber();
            const batchResults = await executeBatches(rewards, distributionEvent, batches);

            batchResults.forEach(res =>{
                totalGasUsed += res.receipt.gasUsed
            });

            // check balances
            expect(await erc20.balanceOf(rewards.address)).to.be.bignumber.equal(new BN(0));
            rewardsToDistribute.map(async (reward) => {
                expect(await erc20.balanceOf(reward.address)).to.be.bignumber.equal(new BN(reward.amount));
            });

            // check events
            const events = await rewards.getPastEvents("RewardDistributed", {fromBlock: firstBlockNumber});
            const readRewards = events.map(log => ({
                address: log.args.recipient.toLowerCase(),
                amount: log.args.amount.toNumber()
            }));
            expect(readRewards).to.have.same.deep.members(rewardsToDistribute);

            //console.log(`total gas used for ${rewardsCount} rewards in ${batches.length} batches is ${totalGasUsed}`);
        });
    });

    it('deploys contract successfully with ERC20 instance', async () => {
        const erc20 = await ERC20.new();
        const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});
        expect(rewards).to.exist;
    });

    it('is not payable', async () => {
        const erc20 = await ERC20.new();
        const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

        await expectRevert(web3.eth.sendTransaction({from:owner, to: rewards.address, value: "1"}));
    });

    const batch0 = generateRewardsSpec(10);
    const batch1 = batch0.splice(5, 9);
    const batchHashes = [hashBatch(web3, 0, batch0), hashBatch(web3,1, batch1)];
    const distributionEvent = "testName";
    describe('announceDistributionEvent', () => {
        it('succeeds for new distributions but fails for ongoing distributions', async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);
            await expectRevert(rewards.announceDistributionEvent(distributionEvent, batchHashes)); // second announcment fails

            await rewards.announceDistributionEvent(distributionEvent + "XX", batchHashes); // a different name works

            await rewards.abortDistributionEvent(distributionEvent);
            await rewards.announceDistributionEvent(distributionEvent, batchHashes); // succeed after aborting
        });
        it('emits RewardsDistributionAnnounced event', async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const result = await rewards.announceDistributionEvent(distributionEvent, batchHashes);

            expect(result.logs).to.have.length(1);
            const firstEvent = result.logs[0];
            expect(firstEvent).to.have.property("event", "RewardsDistributionAnnounced");
            expect(firstEvent.args).to.have.property('distributionEvent', distributionEvent);
            expect(firstEvent.args).to.have.property('batchHash');
            expect(firstEvent.args).to.have.property('batchCount');
            expect(firstEvent.args.batchHash).to.deep.equal(batchHashes);
            expect(firstEvent.args.batchCount).to.be.bignumber.equal(new BN(batchHashes.length));

            const {pendingBatchHashes} = await rewards.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(batchHashes);
        });
        it('records batches under the provided distribution name', async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);

            const {pendingBatchHashes} =  await rewards.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(batchHashes);
        });
    });

    describe('abortDistributionEvent', () => {
        it('emits RewardsDistributionAborted event', async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);
            const result = await rewards.abortDistributionEvent(distributionEvent);

            expect(result.logs).to.have.length(1);
            const firstEvent = result.logs[0];
            expect(firstEvent).to.have.property("event", "RewardsDistributionAborted");
            expect(firstEvent.args).to.have.property('distributionEvent', distributionEvent);
            expect(firstEvent.args).to.have.property('abortedBatchHashes');
            expect(firstEvent.args.abortedBatchHashes).to.deep.equal(batchHashes);
            expect(firstEvent.args).to.have.property('abortedBatchIndices');
            expect(firstEvent.args.abortedBatchIndices.map(n => n.toNumber())).to.deep.equal(batchHashes.map((h, i) => i));
        });

        it('deletes all pending batches', async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);

            const beforeAbort =  await rewards.getPendingBatches(distributionEvent);
            expect(beforeAbort.pendingBatchHashes).to.have.length(batchHashes.length);

            await rewards.abortDistributionEvent(distributionEvent);

            const afterAbort = await rewards.getPendingBatches(distributionEvent);
            expect(afterAbort.pendingBatchHashes).to.have.length(0);
        });
    });

    describe("executeCommittedBatch", () => {
        it("distributes orbs and logs RewardDistributed events for each recipient", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount);

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);
            const executionResult = await executeBatch(rewards, distributionEvent, batch0, 0);

            // check balances
            expect(await erc20.balanceOf(rewards.address)).to.be.bignumber.equal(new BN(0));
            batch0.map(async (reward) => {
                expect(await erc20.balanceOf(reward.address)).to.be.bignumber.equal(new BN(reward.amount));
            });

            // check events
            const RewardDistributedLogs = executionResult.logs.filter(log=>log.event === "RewardDistributed");
            const readRewards = RewardDistributedLogs.map(log => ({
                address: log.args.recipient.toLowerCase(),
                amount: log.args.amount.toNumber()
            }));
            expect(readRewards).to.have.same.deep.members(batch0);
        });

        it("emits RewardsDistributionCompleted event", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.concat(batch1).reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount);

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);
            const firstBatchResult = await executeBatch(rewards, distributionEvent, batch0, 0);
            const secondBatchResult = await executeBatch(rewards, distributionEvent, batch1, 1);

            const firstBatchCompletedEvents = firstBatchResult.logs.filter(log=>log.event === "RewardsDistributionCompleted");
            const secondBatchCompletedEvents = secondBatchResult.logs.filter(log=>log.event === "RewardsDistributionCompleted");

            expect(firstBatchCompletedEvents).to.have.length(0);
            expect(secondBatchCompletedEvents).to.have.length(1);
            expect(secondBatchCompletedEvents[0].args).to.have.property("distributionEvent", distributionEvent);
        });

        it("supports processing batches out of order", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.concat(batch1).reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount);

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);
            await executeBatch(rewards, distributionEvent, batch1, 1);
            await executeBatch(rewards, distributionEvent, batch0, 0);
        });

        it("fails if distributionEvent or was not announced, but succeeds otherwise", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount);

            await expectRevert(executeBatch(rewards, distributionEvent, batch0, 0));

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);
            await executeBatch(rewards, distributionEvent, batch0, 0);
        });

        it("fails if batch or was not announced at exact position, but succeeds for declared batches", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount);

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);

            await expectRevert(executeBatch(rewards, distributionEvent, batch0.slice(1), 0)); // wrong batch list

            await expectRevert(executeBatch(rewards, distributionEvent, batch0, 1)); // wrong batchIndex

            await executeBatch(rewards, distributionEvent, batch0, 0);
        });

        it("fails for zero recipient", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});


            const batchWithZeroAddr = generateRewardsSpec(10);
            batchWithZeroAddr[0].address = batchWithZeroAddr[0].address.replace(/[^x]/g, "0");

            const totalAmount = batchWithZeroAddr.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount);

            const badBatchHashes = [hashBatch(web3,0, batchWithZeroAddr)];
            await rewards.announceDistributionEvent(distributionEvent, badBatchHashes);

            const error = await expectRevert(executeBatch(rewards, distributionEvent, batchWithZeroAddr, 0));
            expect(error).to.have.property("reason", "recipient must be a valid address");
        });

        it("succeeds for zero amount", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const batchWithZeroAmount = generateRewardsSpec(10);
            batchWithZeroAmount[0].amount = 0;

            const totalAmount = batchWithZeroAmount.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount);

            const badBatchHashes = [hashBatch(web3,0, batchWithZeroAmount)];
            await rewards.announceDistributionEvent(distributionEvent, badBatchHashes);

            await executeBatch(rewards, distributionEvent, batchWithZeroAmount, 0);
        });

        it("distributes each batch only once", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount * 2);

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);

            await executeBatch(rewards, distributionEvent, batch0, 0); // first time

            await expectRevert(executeBatch(rewards, distributionEvent, batch0, 0)); // second time
        });

        it("removes the batch hash from pending batches", async () => {
            const erc20 = await ERC20.new();
            const rewards = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(rewards.address, totalAmount * 2);

            await rewards.announceDistributionEvent(distributionEvent, batchHashes);

            const beforeExec = await rewards.getPendingBatches(distributionEvent);
            expect(beforeExec.pendingBatchHashes).to.deep.equal(batchHashes);
            expect(beforeExec.pendingBatchIndices.map(i=>i.toNumber())).to.deep.equal([0,1]);

            await executeBatch(rewards, distributionEvent, batch0, 0); // first time

            const afterExec = await rewards.getPendingBatches(distributionEvent);
            expect(afterExec.pendingBatchHashes).to.deep.equal(batchHashes.slice(1));
            expect(afterExec.pendingBatchIndices.map(i=>i.toNumber())).to.deep.equal([1]);
        });
    });
});

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function executeBatch(rewards, distributionEvent, batch, batchIndex) {
    return rewards.executeCommittedBatch(distributionEvent, batch.map(r => r.address), batch.map(r => r.amount), batchIndex);
}

function generateRewardsSpec(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        const addr = "0x" + (i + 1).toString(16).padStart(40, "0");
        result.push({address: addr, amount: i+1});
    }
    return result;
}


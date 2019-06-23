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

const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');
const ERC20 = artifacts.require('./TestingERC20');

contract('OrbsRewardsDistribution', accounts => {
    const owner = accounts[0];

    describe('integration test - full flow', () => {

        it('full flow integration test - distributes rewards specified in rewards report', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});
            let totalGasUsed = 0;

            // parse input file
            const rewardsCount = 15;
            const rewardsSpec = generateRewardsSpec(rewardsCount);
            const totalAmount = rewardsSpec.reduce((sum, reward) => sum + reward.amount, 0);

            // verify no duplicate recipient
            const uniqueRewardRecipients = (new Set(rewardsSpec.map(i => i.address))).size;
            expect(uniqueRewardRecipients).to.equal(rewardsSpec.length);

            // split to batches
            const batchSize = 3;
            const batches = [];
            const tempRewards = [...rewardsSpec];
            while (tempRewards.length > 0) {
                batches.push(tempRewards.splice(0, batchSize))
            }

            // calculate batch hashes
            const hashes = batches.map((batch, batchId) => hashBatch(batchId, batch));

            // announce distribution event with hash batches
            let res = await instance.announceDistributionEvent("test", hashes, {from: owner});
            totalGasUsed += res.receipt.gasUsed;

            const {pendingBatchHashes} = await instance.getPendingBatches("test");

            expect(pendingBatchHashes).to.deep.equal(hashes);

            // transfer tokens to contract
            await erc20.assign(instance.address, totalAmount);

            expect(await erc20.balanceOf(instance.address)).to.be.bignumber.equal(new BN(totalAmount));

            // execute all batches
            const firstBlockNumber = await web3.eth.getBlockNumber();
            for (let i = 0; i < batches.length; i++) {
                res = await executeBatch(instance, "test", batches[i], i);
                totalGasUsed += res.receipt.gasUsed;
            }

            // check balances
            expect(await erc20.balanceOf(instance.address)).to.be.bignumber.equal(new BN(0));
            rewardsSpec.map(async (reward) => {
                expect(await erc20.balanceOf(reward.address)).to.be.bignumber.equal(new BN(reward.amount));
            });

            // check events
            const events = await instance.getPastEvents("RewardsDistributed", {fromBlock: firstBlockNumber});
            const readRewards = events.map(log => ({
                address: log.args.recipient.toLowerCase(),
                amount: log.args.amount.toNumber()
            }));
            expect(readRewards).to.have.same.deep.members(rewardsSpec);

            //console.log(`total gas used for ${rewardsCount} rewards in ${batches.length} batches is ${totalGasUsed}`);
        });
    });

    it('deploys contract successfully with ERC20 instance', async () => {
        const erc20 = await ERC20.new();
        const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});
        expect(instance).to.exist;
    });

    it('is not payable', async () => {
        const erc20 = await ERC20.new();
        const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

        await expectRevert(web3.eth.sendTransaction({from:owner, to: instance.address, value: "1"}));
    });

    const batch0 = generateRewardsSpec(10);
    const batch1 = batch0.splice(5, 9);
    const batchHashes = [hashBatch(0, batch0), hashBatch(1, batch1)];
    const distributionEvent = "testName";
    describe('announceDistributionEvent', () => {
        it('succeeds for new distributions but fails for ongoing distributions', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await instance.announceDistributionEvent(distributionEvent, batchHashes);
            await expectRevert(instance.announceDistributionEvent(distributionEvent, batchHashes)); // second announcment fails

            await instance.announceDistributionEvent(distributionEvent + "XX", batchHashes); // a different name works

            await instance.abortDistributionEvent(distributionEvent);
            await instance.announceDistributionEvent(distributionEvent, batchHashes); // succeed after aborting
        });
        it('emits RewardsDistributionAnnounced event', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const result = await instance.announceDistributionEvent(distributionEvent, batchHashes);

            expect(result.logs).to.have.length(1);
            const firstEvent = result.logs[0];
            expect(firstEvent).to.have.property("event", "RewardsDistributionAnnounced");
            expect(firstEvent.args).to.have.property('distributionEvent', distributionEvent);
            expect(firstEvent.args).to.have.property('batchHash');
            expect(firstEvent.args).to.have.property('batchCount');
            expect(firstEvent.args.batchHash).to.deep.equal(batchHashes);
            expect(firstEvent.args.batchCount).to.be.bignumber.equal(new BN(batchHashes.length));

            const {pendingBatchHashes} = await instance.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(batchHashes);
        });
        it('records batches under the provided distribution name', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await instance.announceDistributionEvent(distributionEvent, batchHashes);

            const {pendingBatchHashes} =  await instance.getPendingBatches(distributionEvent);
            expect(pendingBatchHashes).to.deep.equal(batchHashes);
        });
    });

    describe('abortDistributionEvent', () => {
        it('emits RewardsDistributionAborted event', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await instance.announceDistributionEvent(distributionEvent, batchHashes);
            const result = await instance.abortDistributionEvent(distributionEvent);

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
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await instance.announceDistributionEvent(distributionEvent, batchHashes);

            const beforeAbort =  await instance.getPendingBatches(distributionEvent);
            expect(beforeAbort.pendingBatchHashes).to.have.length(batchHashes.length);

            await instance.abortDistributionEvent(distributionEvent);

            const afterAbort = await instance.getPendingBatches(distributionEvent);
            expect(afterAbort.pendingBatchHashes).to.have.length(0);
        });
    });

    describe("executeCommittedBatch", () => {
        it("distributes orbs and logs RewardsDistributed events for each recipient", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount);

            await instance.announceDistributionEvent(distributionEvent, batchHashes);
            const executionResult = await executeBatch(instance, distributionEvent, batch0, 0);

            // check balances
            expect(await erc20.balanceOf(instance.address)).to.be.bignumber.equal(new BN(0));
            batch0.map(async (reward) => {
                expect(await erc20.balanceOf(reward.address)).to.be.bignumber.equal(new BN(reward.amount));
            });

            // check events
            const rewardsDistributedLogs = executionResult.logs.filter(log=>log.event === "RewardsDistributed");
            const readRewards = rewardsDistributedLogs.map(log => ({
                address: log.args.recipient.toLowerCase(),
                amount: log.args.amount.toNumber()
            }));
            expect(readRewards).to.have.same.deep.members(batch0);
        });

        it("emits RewardsDistributionCompleted event", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.concat(batch1).reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount);

            await instance.announceDistributionEvent(distributionEvent, batchHashes);
            const firstBatchResult = await executeBatch(instance, distributionEvent, batch0, 0);
            const secondBatchResult = await executeBatch(instance, distributionEvent, batch1, 1);

            const firstBatchCompletedEvents = firstBatchResult.logs.filter(log=>log.event === "RewardsDistributionCompleted");
            const secondBatchCompletedEvents = secondBatchResult.logs.filter(log=>log.event === "RewardsDistributionCompleted");

            expect(firstBatchCompletedEvents).to.have.length(0);
            expect(secondBatchCompletedEvents).to.have.length(1);
            expect(secondBatchCompletedEvents[0].args).to.have.property("distributionEvent", distributionEvent);
        });

        it("supports processing batches out of order", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.concat(batch1).reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount);

            await instance.announceDistributionEvent(distributionEvent, batchHashes);
            await executeBatch(instance, distributionEvent, batch1, 1);
            await executeBatch(instance, distributionEvent, batch0, 0);
        });

        it("fails if distributionEvent or was not announced, but succeeds otherwise", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount);

            await expectRevert(executeBatch(instance, distributionEvent, batch0, 0));

            await instance.announceDistributionEvent(distributionEvent, batchHashes);
            await executeBatch(instance, distributionEvent, batch0, 0);
        });

        it("fails if batch or was not announced at exact position, but succeeds for declared batches", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount);

            await instance.announceDistributionEvent(distributionEvent, batchHashes);

            await expectRevert(executeBatch(instance, distributionEvent, batch0.slice(1), 0)); // wrong batch list

            await expectRevert(executeBatch(instance, distributionEvent, batch0, 1)); // wrong batchIndex

            await executeBatch(instance, distributionEvent, batch0, 0);
        });

        it("fails for zero recipient", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});


            const batchWithZeroAddr = generateRewardsSpec(10);
            batchWithZeroAddr[0].address = batchWithZeroAddr[0].address.replace(/[^x]/g, "0");

            const totalAmount = batchWithZeroAddr.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount);

            const badBatchHashes = [hashBatch(0, batchWithZeroAddr)];
            await instance.announceDistributionEvent(distributionEvent, badBatchHashes);

            const error = await expectRevert(executeBatch(instance, distributionEvent, batchWithZeroAddr, 0));
            expect(error).to.have.property("reason", "recipient must be a valid address");
        });

        it("succeeds for zero amount", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const batchWithZeroAmount = generateRewardsSpec(10);
            batchWithZeroAmount[0].amount = 0;

            const totalAmount = batchWithZeroAmount.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount);

            const badBatchHashes = [hashBatch(0, batchWithZeroAmount)];
            await instance.announceDistributionEvent(distributionEvent, badBatchHashes);

            await executeBatch(instance, distributionEvent, batchWithZeroAmount, 0);
        });

        it("distributes each batch only once", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount * 2);

            await instance.announceDistributionEvent(distributionEvent, batchHashes);

            await executeBatch(instance, distributionEvent, batch0, 0); // first time

            await expectRevert(executeBatch(instance, distributionEvent, batch0, 0)); // second time
        });

        it("removes the batch hash from pending batches", async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const totalAmount = batch0.reduce((sum, reward) => sum + reward.amount, 0);
            await erc20.assign(instance.address, totalAmount * 2);

            await instance.announceDistributionEvent(distributionEvent, batchHashes);

            const beforeExec = await instance.getPendingBatches(distributionEvent);
            expect(beforeExec.pendingBatchHashes).to.deep.equal(batchHashes);
            expect(beforeExec.pendingBatchIndices.map(i=>i.toNumber())).to.deep.equal([0,1]);

            await executeBatch(instance, distributionEvent, batch0, 0); // first time

            const afterExec = await instance.getPendingBatches(distributionEvent);
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

function executeBatch(instance, distributionEvent, batch, batchIndex) {
    return instance.executeCommittedBatch(distributionEvent, batch.map(r => r.address), batch.map(r => r.amount), batchIndex);
}

function generateRewardsSpec(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        const addr = "0x" + (i + 1).toString(16).padStart(40, "0");
        result.push({address: addr, amount: i+1});
    }
    return result;
}

function hashBatch(batchId, batch) {
    let addresses = [];
    let amounts = [];
    batch.map((reward, index) => {
        const bytes32PaddedAddress = web3.utils.leftPad(reward.address, 64);
        addresses[index] = {t: 'bytes32', v: bytes32PaddedAddress};
        amounts[index] = {t: 'uint256', v: reward.amount};
    });
    return web3.utils.soliditySha3(
        {t: 'uint256', v: batchId},
        {t: 'uint256', v: batch.length},
        ...addresses,
        ...amounts
    );
}

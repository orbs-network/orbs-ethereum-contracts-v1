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

            const pendingHashes = await instance.getPendingBatches("test");

            expect(pendingHashes.batchHashes).to.deep.equal(hashes);

            // transfer tokens to contract
            await erc20.assign(instance.address, totalAmount);

            expect(await erc20.balanceOf(instance.address)).to.be.bignumber.equal(new BN(totalAmount));

            // execute all batches
            const firstBlockNumber = await web3.eth.getBlockNumber();
            for (let i = 0; i < batches.length; i++) {
                res = await instance.executeCommittedBatch("test", batches[i].map(r => r.address), batches[i].map(r => r.amount), i);
                totalGasUsed += res.receipt.gasUsed;
            }
            console.log(`total gas used for ${rewardsCount} rewards in ${batches.length} batches is ${totalGasUsed}`);

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

        });
    });

    it('deploys contract successfully with ERC20 instance', async () => {
        const erc20 = await ERC20.new();
        const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});
        expect(instance).to.exist;
    });

    const batch1 = generateRewardsSpec(10);
    const batch2 = batch1.splice(5, 9);
    const batchHashes = [hashBatch(1, batch1, hashBatch(2, batch2))];
    const distributionName = "testName";
    describe('announceDistributionEvent', () => {
        it('succeeds for new distributions but fails for ongoing distributions', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await instance.announceDistributionEvent(distributionName, batchHashes);
            await expectRevert(instance.announceDistributionEvent(distributionName, batchHashes)); // second announcment fails

            await instance.announceDistributionEvent(distributionName + "XX", batchHashes); // a different name works

            await instance.abortDistributionEvent(distributionName);
            await instance.announceDistributionEvent(distributionName, batchHashes); // succeed after aborting
        });
        it('emits RewardsDistributionAnnounced event', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            const result = await instance.announceDistributionEvent(distributionName, batchHashes);

            expect(result.logs).to.have.length(1);
            const firstEvent = result.logs[0];
            expect(firstEvent).to.have.property("event", "RewardsDistributionAnnounced");
            expect(firstEvent.args).to.have.property('distributionName', distributionName);
            expect(firstEvent.args).to.have.property('batchHash');
            expect(firstEvent.args).to.have.property('batchCount');
            expect(firstEvent.args.batchHash).to.deep.equal(batchHashes);
            expect(firstEvent.args.batchCount).to.be.bignumber.equal(new BN(batchHashes.length));

            const storedHashes = await instance.getPendingBatches(distributionName);
            expect(storedHashes.batchHashes).to.deep.equal(batchHashes);
        });
        it('records batches under the provided distribution name', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await instance.announceDistributionEvent(distributionName, batchHashes);

            const storedHashes = await instance.getPendingBatches(distributionName);
            expect(storedHashes.batchHashes).to.deep.equal(batchHashes);
        });
    });

    describe('abortDistributionEvent', () => {
        it('emits RewardsDistributionAborted event', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await instance.announceDistributionEvent(distributionName, batchHashes);
            const result = await instance.abortDistributionEvent(distributionName);

            expect(result.logs).to.have.length(1);
            const firstEvent = result.logs[0];
            expect(firstEvent).to.have.property("event", "RewardsDistributionAborted");
            expect(firstEvent.args).to.have.property('distributionName', distributionName);
            expect(firstEvent.args).to.have.property('abortedBatchHashes');
            expect(firstEvent.args.abortedBatchHashes).to.deep.equal(batchHashes);
            expect(firstEvent.args).to.have.property('abortedBatchNums');
            expect(firstEvent.args.abortedBatchNums.map(n=>n.toNumber())).to.deep.equal(batchHashes.map((h,i)=>i));
        });

        it('deletes all pending batches', async () => {
            const erc20 = await ERC20.new();
            const instance = await OrbsRewardsDistribution.new(erc20.address, {from: owner});

            await instance.announceDistributionEvent(distributionName, batchHashes);

            await instance.abortDistributionEvent(distributionName);
            const batchesAfterAbortion = await instance.getPendingBatches(distributionName);
            expect(batchesAfterAbortion.batchHashes).to.have.length(0);
        });
    });
});

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function generateRewardsSpec(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        const addr = "0x" + (i + 1).toString(16).padStart(40, "0");
        result.push({address: addr, amount: i});
    }
    return result;
}

function hashBatch(batchId, batch) {
    let addresses = [];
    let amounts = [];
    batch.map((reward, index) => {
        const bytes32PaddedAddress = web3.utils.leftPad(reward.address, 64);
        addresses[index] = {t: 'bytes32',v: bytes32PaddedAddress};
        amounts[index] = {t: 'uint256', v: reward.amount};
    });
    return web3.utils.soliditySha3(
        {t: 'uint256', v: batchId},
        {t: 'uint256', v: batch.length},
        ...addresses,
        ...amounts
    );
}

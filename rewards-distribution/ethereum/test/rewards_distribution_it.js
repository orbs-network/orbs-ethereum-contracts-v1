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

const sjcl = require("sjcl");
const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');
const ERC20 = artifacts.require('./TestingERC20');

contract('OrbsRewardsDistribution', accounts => {
    const owner = accounts[0];

    it('distributes rewards specified in rewards report', async () => {
        const erc20 = await ERC20.new();
        const instance = await OrbsRewardsDistribution.new(erc20.address, { from: owner });

        // parse input file
        const rewardsCount = 41;
        const rewards = generateRewards(rewardsCount);
        const totalAmount = rewards.reduce((sum, reward) => sum + reward.amount, 0);

        // verify no duplicate recipient
        const uniqueRewardRecipients = (new Set(rewards.map(i=>i.address))).size;
        expect(uniqueRewardRecipients).to.equal(rewards.length);

        // split to batches
        const batchSize = 13;
        const batches = [];
        const tempRewards = [...rewards];
        while (tempRewards.length > 0) {
            batches.push(tempRewards.splice(0,batchSize))
        }

        // calculate batch hashes
        const hashes = batches.map((batch, batchId)=>"0x"+hashBatch(batchId, batch));

        // announce distribution event with hash batches

        await instance.announceDistributionEvent("test", hashes, {from: owner});
        const pendingHashes = await instance.getPendingBatches("test");

        expect(pendingHashes).to.deep.equal(hashes);

        // transfer tokens to contract
        await erc20.assign(instance.address, totalAmount);
        expect(await erc20.balanceOf(instance.address)).to.be.bignumber.equal(new BN(totalAmount));

        // execute all batches
        const firstBlockNumber = await web3.eth.getBlockNumber();
        for (let i = 0; i < batches.length; i++) {
            await instance.executeCommittedBatch("test", batches[i].map(r=>r.address), batches[i].map(r=>r.amount), i);
        }

        // check balances
        expect(await erc20.balanceOf(instance.address)).to.be.bignumber.equal(new BN(0));
        rewards.map(async (reward)=>{
            expect(await erc20.balanceOf(reward.address)).to.be.bignumber.equal(new BN(reward.amount));
        });

        // check events
        const events = await instance.getPastEvents("RewardsDistributed", {fromBlock: firstBlockNumber});
        const readRewards = events.map(log=>({address: log.args.recipient.toLowerCase(), amount:log.args.amount.toNumber()}));
        expect(readRewards).to.have.same.deep.members(rewards);

    });
});

function generateRewards(count) {
    const result = [];
    for (let i=0; i < count; i++) {
        const addr = "0x" + (i+1).toString(16).padStart(40, "0");
        result.push({address: addr, amount: i});
    }
    return result;
}

function hashBatch(batchId, batch) {
    const sha = new sjcl.hash.sha256();
    sha.update(`${batchId}:`);
    for (let i=0; i < batch.length; i++) {
        sha.update(`${batch[i].address}${batch[i].amount}_`);
    }
    return sjcl.codec.hex.fromBits(sha.finalize());
}

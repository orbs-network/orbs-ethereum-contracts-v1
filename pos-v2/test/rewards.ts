import Web3 from "web3";
declare const web3: Web3;

import BN from "bn.js";
import {Driver} from "./driver";
import chai from "chai";
chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const {feeAddedToBucketEvents} = require('./eventParsing');

const MONTH_IN_SECONDS = 30*24*60*60;

async function txTimestamp(r): Promise<number> {
  return (await web3.eth.getBlock(r.receipt.blockNumber)).timestamp as number;
}

const expect = chai.expect;

declare const Promise: any;

async function sleep(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

contract('pos-v2-high-level-flows', async () => {

  it('should distribute fees to validators in committee', async () => {
    const d = await Driver.new();

    const initialStake = new BN(1000);
    const v = d.newParticipant();
    await v.stake(initialStake);
    await v.registerAsValidator();

    const rate = 20000000;
    const subs = await d.newSubscriber('tier', rate);

    const appOwner = d.newParticipant();
    const payment = 12*rate;
    await d.erc20.assign(appOwner.address, payment);
    await d.erc20.approve(subs.address, payment, {from: appOwner.address});

    let r = await subs.createVC(payment, {from: appOwner.address});
    let startTime = await txTimestamp(r); // TODO

    const feesAdded = feeAddedToBucketEvents(r);

    // all the payed rewards were added to a bucket
    const totalAdded = feesAdded.reduce((t, l)=>t.add(new BN(l.added)), new BN(0));
    expect(totalAdded).to.be.bignumber.equal(new BN(payment));

    // the first bucket was added to with proportion to the remaining time
    const secondsInFirstMonth = parseInt(feesAdded[1].bucketId) - startTime;
    expect(parseInt(feesAdded[0].added)).to.equal(Math.floor(secondsInFirstMonth * rate / MONTH_IN_SECONDS));

    // all middle buckets were added to by the monthly rate
    const middleBuckets = feesAdded.filter((l, i)=>i>0 && i < feesAdded.length-1);
    expect(middleBuckets).to.have.length(feesAdded.length-2);
    middleBuckets.forEach(l=>{
      expect(l.added).to.be.bignumber.equal(new BN(rate));
    });

    r = await d.rewards.getLastPayedAt();
    expect(r).to.be.bignumber.equal(new BN(startTime));

    await sleep(3000);

    r = await d.rewards.assignRewards();
    const endTime = await txTimestamp(r); // TODO

    const elapsedTime = endTime - startTime;
    const expectedRewards = new BN(Math.floor(rate * elapsedTime / MONTH_IN_SECONDS));

    r = await d.rewards.getBalance(v.address);
    expect(r).to.be.bignumber.equal(new BN(expectedRewards));

    r = await d.rewards.distributeRewards([v.address], [expectedRewards], {from: v.address});
    expect(r).to.have.a.stakedEvent({
      stakeOwner: v.address,
      amount: expectedRewards,
      totalStakedAmount: initialStake.add(expectedRewards)
    });
  });

});

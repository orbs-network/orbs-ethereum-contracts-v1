import Web3 from "web3";
import BN from "bn.js";
import {Driver} from "./driver";
import chai from "chai";
import {feeAddedToBucketEvents, rewardAssignedEvents} from "./event-parsing";

declare const web3: Web3;

chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const MONTH_IN_SECONDS = 30*24*60*60;

async function txTimestamp(r): Promise<number> {
  return (await web3.eth.getBlock(r.receipt.blockNumber)).timestamp as number;
}

const expect = chai.expect;

declare const Promise: any;

async function sleep(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

contract('rewards-level-flows', async () => {

  it('should distribute fees to validators in committee', async () => {
    const d = await Driver.new();

    const initStakeLesser = new BN(17000);
    const v1 = d.newParticipant();
    await v1.stake(initStakeLesser);
    await v1.registerAsValidator();
    await v1.notifyReadyForCommittee();

    const initStakeLarger = new BN(21000);
    const v2 = d.newParticipant();
    await v2.stake(initStakeLarger);
    await v2.registerAsValidator();
    await v2.notifyReadyForCommittee();

    const rate = 20000000;
    const subs = await d.newSubscriber('tier', rate);

    const appOwner = d.newParticipant();
    const payment = 12*rate;
    await d.erc20.assign(appOwner.address, payment);
    await d.erc20.approve(subs.address, payment, {from: appOwner.address});

    let r = await subs.createVC(payment, {from: appOwner.address});
    let startTime = await txTimestamp(r);

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
    const rewardAssigned = rewardAssignedEvents(r);
    const endTime = await txTimestamp(r);

    const elapsedTime = endTime - startTime;
    const totalCommitteeStake = initStakeLesser.add(initStakeLarger);
    const expectedRewards = new BN(Math.floor(rate * elapsedTime / MONTH_IN_SECONDS));
    const expectedRewardsArr  = [(expectedRewards.mul(initStakeLarger).div(totalCommitteeStake)), (expectedRewards.mul(initStakeLesser).div(totalCommitteeStake))];
    const remainder = expectedRewards.sub(expectedRewardsArr[1]).sub(expectedRewardsArr[0]);

    const remainderWinnerIdx = endTime % expectedRewardsArr.length;
    expectedRewardsArr[remainderWinnerIdx] = expectedRewardsArr[remainderWinnerIdx].add(remainder);

    let r1 = await d.rewards.getBalance(v1.address);
    let r2 = await d.rewards.getBalance(v2.address);

    expect(r1).to.be.bignumber.equal(new BN(expectedRewardsArr[1]));
    expect(r2).to.be.bignumber.equal(new BN(expectedRewardsArr[0]));

    r = await d.rewards.distributeRewards([v1.address], [expectedRewardsArr[1]], {from: v1.address});
    expect(r).to.have.a.stakedEvent({
      stakeOwner: v1.address,
      amount: expectedRewardsArr[1],
      totalStakedAmount: initStakeLesser.add(expectedRewardsArr[1])
    });

    expect(r).to.have.committeeChangedEvent({
      orbsAddrs: [v2.orbsAddress, v1.orbsAddress],
      addrs: [v2.address, v1.address],
      stakes: [initStakeLarger, initStakeLesser.add(expectedRewardsArr[1])]
    });

    r = await d.rewards.distributeRewards([v2.address], [expectedRewardsArr[0]], {from: v2.address});
    expect(r).to.have.a.stakedEvent({
      stakeOwner: v2.address,
      amount: expectedRewardsArr[0],
      totalStakedAmount: initStakeLarger.add(expectedRewardsArr[0])
    });
    expect(r).to.have.committeeChangedEvent({
      orbsAddrs: [v2.orbsAddress, v1.orbsAddress],
      addrs: [v2.address, v1.address],
      stakes: [initStakeLarger.add(expectedRewardsArr[0]), initStakeLesser.add(expectedRewardsArr[1])]
    })
  });

});

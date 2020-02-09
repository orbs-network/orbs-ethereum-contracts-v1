import * as _ from "lodash";
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

  it.only('should distribute fees to validators in committee', async () => {
    const d = await Driver.new();

    /* top up fixed pool */
    const g = d.rewardsGovernor;

    const fixedPoolRate = new BN(1000);
    const fixedPoolAmount = new BN(1000).mul(new BN(12));

    await d.rewards.setFixedPoolMonthlyRate(fixedPoolRate, {from: g.address});
    await g.assignAndApproveExternalToken(fixedPoolAmount, d.rewards.address);
    await d.rewards.topUpFixedPool(fixedPoolAmount, {from: g.address});

    /* top up pro-rata pool */

    const proRataPoolRate = new BN(2000);
    const proRataPoolAmount = new BN(2000).mul(new BN(12));

    await d.rewards.setProRataPoolMonthlyRate(proRataPoolRate, {from: g.address});
    await g.assignAndApproveOrbs(proRataPoolAmount, d.rewards.address);
    await d.rewards.topUpProRataPool(proRataPoolAmount, {from: g.address});

    // create committee

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

    const validators = [{
      v: v2,
      stake: initStakeLarger
    }, {
      v: v1,
      stake: initStakeLesser
    }];

    const nValidators = validators.length;

    // create a new VC

    const vcRate = 20000000;
    const subs = await d.newSubscriber('tier', vcRate);

    const appOwner = d.newParticipant();
    const payment = 12 * vcRate;
    await d.erc20.assign(appOwner.address, payment);
    await d.erc20.approve(subs.address, payment, {from: appOwner.address});

    let r = await subs.createVC(payment, {from: appOwner.address});
    let startTime = await txTimestamp(r);

    const feesAdded = feeAddedToBucketEvents(r);

    // all the payed rewards were added to a bucket
    const totalAdded = feesAdded.reduce((t, l) => t.add(new BN(l.added)), new BN(0));
    expect(totalAdded).to.be.bignumber.equal(new BN(payment));

    // the first bucket was added to with proportion to the remaining time
    const secondsInFirstMonth = parseInt(feesAdded[1].bucketId) - startTime;
    expect(parseInt(feesAdded[0].added)).to.equal(Math.floor(secondsInFirstMonth * vcRate / MONTH_IN_SECONDS));

    // all middle buckets were added to by the monthly rate
    const middleBuckets = feesAdded.filter((l, i) => i > 0 && i < feesAdded.length - 1);
    expect(middleBuckets).to.have.length(feesAdded.length - 2);
    middleBuckets.forEach(l => {
      expect(l.added).to.be.bignumber.equal(new BN(vcRate));
    });

    r = await d.rewards.getLastPayedAt();
    expect(r).to.be.bignumber.equal(new BN(startTime));

    await sleep(3000);

    r = await d.rewards.assignRewards();
    const endTime = await txTimestamp(r);

    const remainderWinnerIdx = endTime % nValidators;
    const elapsedTime = endTime - startTime;
    const totalCommitteeStake = new BN(_.sumBy(validators, v => v.stake));

    // Calculate expected rewards from VC fees
    const expectedFeesRewards = new BN(Math.floor(vcRate * elapsedTime / MONTH_IN_SECONDS));
    const expectedFeesRewardsArr = [expectedFeesRewards.div(new BN(nValidators)), expectedFeesRewards.div(new BN(nValidators))];
    const feesRemainder = expectedFeesRewards.sub(expectedFeesRewardsArr[1]).sub(expectedFeesRewardsArr[0]);
    expectedFeesRewardsArr[remainderWinnerIdx] = expectedFeesRewardsArr[remainderWinnerIdx].add(feesRemainder);

    // Calculate expected rewards from pro-rata pool
    const expectedProRataPoolRewards = proRataPoolRate.mul(new BN(elapsedTime)).div(new BN(MONTH_IN_SECONDS));
    const expectedProRataPoolRewardsArr = [(expectedProRataPoolRewards.mul(initStakeLarger).div(totalCommitteeStake)), (expectedProRataPoolRewards.mul(initStakeLesser).div(totalCommitteeStake))];
    const proRataPoolRemainder = expectedProRataPoolRewards.sub(expectedProRataPoolRewardsArr[1]).sub(expectedProRataPoolRewardsArr[0]);
    expectedProRataPoolRewardsArr[remainderWinnerIdx] = expectedProRataPoolRewardsArr[remainderWinnerIdx].add(proRataPoolRemainder);

    // Calculate expected rewards from fixed pool
    const expectedFixedPoolRewards = fixedPoolRate.mul(new BN(elapsedTime)).div(new BN(MONTH_IN_SECONDS));
    const expectedFixedPoolRewardsArr = [expectedFixedPoolRewards.div(new BN(nValidators)), expectedFixedPoolRewards.div(new BN(nValidators))];
    const fixedPoolRemainder = expectedFixedPoolRewards.sub(expectedFixedPoolRewardsArr[1]).sub(expectedFixedPoolRewardsArr[0]);
    expectedFixedPoolRewardsArr[remainderWinnerIdx] = expectedFixedPoolRewardsArr[remainderWinnerIdx].add(fixedPoolRemainder);

    const totalOrbsRewardsArr = expectedFeesRewardsArr.map((r, i) => r.add(expectedProRataPoolRewardsArr[i]));
    const totalExternalTokenRewardsArr = expectedFixedPoolRewardsArr;

    await Promise.all(validators.map(async (v, i) => {
      let orbsBalance = await d.rewards.getOrbsBalance(v.v.address);
      let externalTokenBalance = await d.rewards.getExternalTokenBalance(v.v.address);
      expect(orbsBalance).to.be.bignumber.equal(new BN(totalOrbsRewardsArr[i]));
      expect(externalTokenBalance).to.be.bignumber.equal(new BN(totalExternalTokenRewardsArr[i]));

      r = await d.rewards.distributeOrbsTokenRewards([v.v.address], [totalOrbsRewardsArr[i]], {from: v.v.address});
      expect(r).to.have.a.stakedEvent({
        stakeOwner: v.v.address,
        amount: totalOrbsRewardsArr[i],
        totalStakedAmount: new BN(v.stake).add(totalOrbsRewardsArr[i])
      });
      expect(r).to.have.committeeChangedEvent({
        orbsAddrs: validators.map(v => v.v.orbsAddress),
        addrs: validators.map(v => v.v.address),
        stakes: validators.map((_v, _i) => _i <= i ? new BN(_v.stake).add(totalOrbsRewardsArr[_i]) : new BN(_v.stake))
        // stakes: [initStakeLarger, initStakeLesser.add(totalOrbsRewardsArr[1])]
      });
    }));
  })
});

import * as _ from "lodash";
import Web3 from "web3";
import BN from "bn.js";
import {Driver} from "./driver";
import chai from "chai";
import {feeAddedToBucketEvents} from "./event-parsing";

declare const web3: Web3;

chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const MONTH_IN_SECONDS = 30*24*60*60;

async function txTimestamp(r): Promise<number> {
  return (await web3.eth.getBlock(r.receipt.blockNumber)).timestamp as number;
}

const expect = chai.expect;

async function sleep(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

contract('rewards-level-flows', async () => {

  it('should distribute fees to validators in committee', async () => {
    const d = await Driver.new();

    /* top up fixed pool */
    const g = d.rewardsGovernor;

    const fixedPoolRate = 10000000;
    const fixedPoolAmount = fixedPoolRate*12;

    await d.rewards.setFixedPoolMonthlyRate(fixedPoolRate, {from: g.address});
    await g.assignAndApproveExternalToken(fixedPoolAmount, d.rewards.address);
    await d.rewards.topUpFixedPool(fixedPoolAmount, {from: g.address});

    /* top up pro-rata pool */

    const proRataPoolRate = 2000000000;
    const proRataPoolAmount = proRataPoolRate*12;

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

    const vcRate = 3000000000;
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

    expect(await d.rewards.getLastPayedAt()).to.be.bignumber.equal(new BN(startTime));

    // creating the VC has triggered reward assignment. we wish to ignore it, so we take initial balance
    // and subtract it afterwards

    const initialOrbsBalances:BN[] = [];
    const initialExternalBalances:BN[] = [];
    for (const v of validators) {
      initialOrbsBalances.push(new BN(await d.rewards.getOrbsBalance(v.v.address)));
      initialExternalBalances.push(new BN(await d.rewards.getExternalTokenBalance(v.v.address)));
    }

    await sleep(3000);

    r = await d.rewards.assignRewards();
    const endTime = await txTimestamp(r);
    const elapsedTime = endTime - startTime;

    const calcRewards = (rate: number, type:"fixed"|"prorata") => {
      const remainderWinnerIdx = endTime % nValidators;
      const totalCommitteeStake = new BN(_.sumBy(validators, v => v.stake.toNumber()));

      const rewards = new BN(Math.floor(rate * elapsedTime / MONTH_IN_SECONDS));
      const rewardsArr = type == "fixed" ?
          validators.map(() => rewards.div(new BN(validators.length)))
          :
          validators.map(v => rewards.mul(v.stake).div(totalCommitteeStake));
      const remainder =  rewards.sub(new BN(_.sumBy(rewardsArr, r => r.toNumber())));
      rewardsArr[remainderWinnerIdx] = rewardsArr[remainderWinnerIdx].add(remainder);
      return rewardsArr;
    };

    // Calculate expected rewards from VC fees
    const expectedFeesRewardsArr = calcRewards(vcRate, "fixed");

    // Calculate expected rewards from pro-rata pool
    const expectedProRataPoolRewardsArr = calcRewards(proRataPoolRate, "prorata");

    // Calculate expected rewards from fixed pool
    const expectedFixedPoolRewardsArr = calcRewards(fixedPoolRate, "fixed");

    // Total of each token
    const totalOrbsRewardsArr = expectedFeesRewardsArr.map((r, i) => r.add(expectedProRataPoolRewardsArr[i]));
    const totalExternalTokenRewardsArr = expectedFixedPoolRewardsArr;

    const orbsBalances:BN[] = [];
    const externalBalances:BN[] = [];
    for (const v of validators) {
      orbsBalances.push(new BN(await d.rewards.getOrbsBalance(v.v.address)));
      externalBalances.push(new BN(await d.rewards.getExternalTokenBalance(v.v.address)));
    }

    for (const v of validators) {
      const i = validators.indexOf(v);
      let orbsBalance = orbsBalances[i].sub(initialOrbsBalances[i]);
      expect(orbsBalance).to.be.bignumber.equal(new BN(totalOrbsRewardsArr[i]));

      let externalTokenBalance = externalBalances[i].sub(initialExternalBalances[i]);
      expect(externalTokenBalance).to.be.bignumber.equal(new BN(totalExternalTokenRewardsArr[i]));

      r = await d.rewards.distributeOrbsTokenRewards([v.v.address], [totalOrbsRewardsArr[i]], {from: v.v.address});
      expect(r).to.have.a.stakedEvent({
        stakeOwner: v.v.address,
        amount: totalOrbsRewardsArr[i],
        totalStakedAmount: new BN(v.stake).add(totalOrbsRewardsArr[i])
      });
      expect(r).to.have.a.committeeChangedEvent({
        orbsAddrs: validators.map(v => v.v.orbsAddress),
        addrs: validators.map(v => v.v.address),
        stakes: validators.map((_v, _i) => (_i <= i) ? new BN(_v.stake).add(totalOrbsRewardsArr[_i]) : new BN(_v.stake))
      });

      // claim the external token rewards
      const expectedBalance = parseInt(await d.rewards.getExternalTokenBalance(v.v.address));
      expect(expectedBalance).to.be.at.least(externalBalances[i].toNumber()); // at least - because new rewards may have already been assigned
      await d.rewards.claimExternalTokenRewards({from: v.v.address});
      const externalBalance = await d.externalToken.balanceOf(v.v.address);
      expect(new BN(externalBalance)).to.bignumber.equal(new BN(expectedBalance));
    }

  })
});

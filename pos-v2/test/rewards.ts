import Web3 from "web3";
declare const web3: Web3;

import BN from "bn.js";
import {Driver} from "./driver";
import chai from "chai";
chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const {subscriptionChangedEvent} = require('./eventParsing');

async function txTimestamp(r): Promise<number> {
  return (await web3.eth.getBlock(r.receipt.blockNumber)).timestamp as number;
}

const expect = chai.expect;

declare const Promise: any;

async function sleep(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

contract('pos-v2-high-level-flows', async () => {

  it('registers and pays for a VC', async () => {
    const d = await Driver.new();

    const initialStake = 1000;
    const v = d.newParticipant();
    await v.stake(initialStake);
    await v.registerAsValidator();

    const rate = 2000000;
    const subs = await d.newSubscriber('tier', rate);

    const appOwner = d.newParticipant();
    const payment = 12*rate;
    await d.erc20.assign(appOwner.address, payment);
    await d.erc20.approve(subs.address, payment, {from: appOwner.address});

    let r = await subs.createVC(12*rate, {from: appOwner.address});
    let startTime = await txTimestamp(r); // TODO

    await sleep(3000);

    r = await d.rewards.assignRewards();

    const endTime = await txTimestamp(r); // TODO

    const MONTH_IN_SECONDS = 30*24*60*60;
    const elapsedTime = endTime - startTime;
    const expectedRewards = rate * elapsedTime / MONTH_IN_SECONDS;

    r = await d.rewards.distributeRewards([v.address], [Math.floor(expectedRewards)], {from: v.address});
    expect(r).to.have.a.stakedEvent({
      stakeOwner: v.address,
      amount: new BN(initialStake + Math.floor(expectedRewards))
    })
  });

});

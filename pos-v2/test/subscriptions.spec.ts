import 'mocha';

import BN from "bn.js";
import {Driver, expectRejected, ZERO_ADDR} from "./driver";
import chai from "chai";
import {subscriptionChangedEvents} from "./event-parsing";
import {web3} from "../eth";
import {bn} from "./helpers";
chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const expect = chai.expect;

describe('subscriptions-high-level-flows', async () => {

  it('registers and pays for a VC', async () => {
    const d = await Driver.new();

    const monthlyRate = new BN(1000);
    const firstPayment = monthlyRate.mul(new BN(2));

    const subscriber = await d.newSubscriber("defaultTier", monthlyRate);
    // buy subscription for a new VC
    const appOwner = d.newParticipant();
    await d.erc20.assign(appOwner.address, firstPayment); // TODO extract assign+approve to driver in two places
    await d.erc20.approve(subscriber.address, firstPayment, {from: appOwner.address});

    let r = await subscriber.createVC(firstPayment, "main",  {from: appOwner.address});

    expect(r).to.have.subscriptionChangedEvent();
    const firstSubsc = subscriptionChangedEvents(r).pop()!;

    const blockNumber = new BN(r.blockNumber);
    const blockTimestamp = new BN((await web3.eth.getBlock(blockNumber)).timestamp);
    const expectedGenRef = blockNumber.add(new BN('300'));
    const secondsInMonth = new BN(30 * 24 * 60 * 60);
    const payedDurationInSeconds = firstPayment.mul(secondsInMonth).div(monthlyRate);
    let expectedExpiration = new BN(blockTimestamp).add(payedDurationInSeconds);

    expect(firstSubsc.vcid).to.exist;
    expect(firstSubsc.genRef).to.be.bignumber.equal(expectedGenRef);
    expect(firstSubsc.expiresAt).to.be.bignumber.equal(expectedExpiration);
    expect(firstSubsc.tier).to.equal("defaultTier");

    let vcid = firstSubsc.vcid;
    expect(r).to.have.paymentEvent({vcid, by: appOwner.address, amount: firstPayment, tier: "defaultTier", rate: monthlyRate});

    // Buy more time
    const anotherPayer = d.newParticipant(); // Notice - anyone can pay for any VC without affecting ownership. TBD?
    const secondPayment = new BN(3000);
    await d.erc20.assign(anotherPayer.address, secondPayment);
    await d.erc20.approve(subscriber.address, secondPayment, {from: anotherPayer.address});

    r = await subscriber.extendSubscription(vcid, secondPayment, {from: anotherPayer.address});
    expect(r).to.have.paymentEvent({vcid, by: anotherPayer.address, amount: secondPayment, tier: "defaultTier", rate: monthlyRate});

    expect(r).to.have.subscriptionChangedEvent();
    const secondSubsc = subscriptionChangedEvents(r).pop()!;

    const extendedDurationInSeconds = secondPayment.mul(secondsInMonth).div(monthlyRate);
    expectedExpiration = new BN(firstSubsc.expiresAt).add(extendedDurationInSeconds);

    expect(secondSubsc.vcid).to.equal(firstSubsc.vcid);
    expect(secondSubsc.genRef).to.be.equal(firstSubsc.genRef);
    expect(secondSubsc.expiresAt).to.be.bignumber.equal(expectedExpiration);
    expect(secondSubsc.tier).to.equal("defaultTier");


    expect(await d.erc20.balanceOf(appOwner.address)).is.bignumber.equal('0');
    expect(await d.erc20.balanceOf(anotherPayer.address)).is.bignumber.equal('0');
    expect(await d.erc20.balanceOf(subscriber.address)).is.bignumber.equal('0');
    expect(await d.erc20.balanceOf(d.subscriptions.address)).is.bignumber.equal('0');

    expect(await d.erc20.balanceOf(d.rewards.address)).is.bignumber.equal(firstPayment.add(secondPayment));
  });

  it('registers subsciber only by owner', async () => {
    const d = await Driver.new();
    const subscriber = await d.newSubscriber('tier', 1);

    await expectRejected(d.subscriptions.addSubscriber(subscriber.address, {from: d.contractsNonOwner}), "Non-owner should not be able to add a subscriber");
    await d.subscriptions.addSubscriber(subscriber.address, {from: d.contractsOwner});
  });

  it('should not add a subscriber with a zero address', async () => {
    const d = await Driver.new();
    await expectRejected(d.subscriptions.addSubscriber(ZERO_ADDR, {from: d.contractsOwner}), "Should not deploy a subscriber with a zero address");
  });

  it('is able to create multiple VCs from the same subscriber', async () => {
    const d = await Driver.new();
    const subs = await d.newSubscriber("tier", 1);

    const owner = d.newParticipant();
    const amount = 10;

    await owner.assignAndApproveOrbs(amount, subs.address);
    let r = await subs.createVC(amount, "main",  {from: owner.address});
    expect(r).to.have.a.subscriptionChangedEvent();

    await owner.assignAndApproveOrbs(amount, subs.address);
    r = await subs.createVC(amount, "main",  {from: owner.address});
    expect(r).to.have.a.subscriptionChangedEvent();
  });

  it('sets, overrides, gets and clears a vc config field by and only by the vc owner', async () => {
    const d = await Driver.new();
    const subs = await d.newSubscriber("tier", 1);

    const owner = d.newParticipant();
    const amount = 10;

    await owner.assignAndApproveOrbs(amount, subs.address);
    let r = await subs.createVC(amount, "main",  {from: owner.address});
    expect(r).to.have.a.subscriptionChangedEvent();
    const vcid = new BN(subscriptionChangedEvents(r)[0].vcid);

    const key = 'key_' + Date.now().toString();

    // set
    const value = 'value_' + Date.now().toString();
    r = await d.subscriptions.setVcConfigRecord(vcid, key, value, {from: owner.address});
    expect(r).to.have.a.vcConfigRecordChangedEvent({
      vcid,
      key,
      value
    });

    // get
    const nonOwner = d.newParticipant();
    let v = await d.subscriptions.getVcConfigRecord(vcid, key, {from: nonOwner.address});
    expect(v).to.equal(value);

    // override
    const value2 = 'value2_' + Date.now().toString();
    r = await d.subscriptions.setVcConfigRecord(vcid, key, value2, {from: owner.address});
    expect(r).to.have.a.vcConfigRecordChangedEvent({
      vcid,
      key,
      value: value2
    });

    // get again
    v = await d.subscriptions.getVcConfigRecord(vcid, key, {from: nonOwner.address});
    expect(v).to.equal(value2);

    // clear
    r = await d.subscriptions.setVcConfigRecord(vcid, key, "", {from: owner.address});
    expect(r).to.have.a.vcConfigRecordChangedEvent({
      vcid,
      key,
      value: ""
    });

    // get again
    v = await d.subscriptions.getVcConfigRecord(vcid, key, {from: nonOwner.address});
    expect(v).to.equal("");

    // reject if set by non owner
    await expectRejected(d.subscriptions.setVcConfigRecord(vcid, key, value, {from: nonOwner.address}));
  });

  it('allows VC owner to transfer ownership', async () => {
    const d = await Driver.new();
    const subs = await d.newSubscriber("tier", 1);

    const owner = d.newParticipant();

    const amount = 10;
    await owner.assignAndApproveOrbs(amount, subs.address);
    let r = await subs.createVC(amount, "main", {from: owner.address});
    expect(r).to.have.a.subscriptionChangedEvent();
    const vcid = bn(subscriptionChangedEvents(r)[0].vcid);
    expect(r).to.have.a.vcCreatedEvent({
      vcid,
      owner: owner.address
    });

    const newOwner = d.newParticipant();

    const nonOwner = d.newParticipant();
    await expectRejected(d.subscriptions.setVcOwner(vcid, newOwner.address, {from: nonOwner.address}));

    r = await d.subscriptions.setVcOwner(vcid, newOwner.address, {from: owner.address});
    expect(r).to.have.a.vcOwnerChangedEvent({
      vcid,
      previousOwner: owner.address,
      newOwner: newOwner.address
    });

    await expectRejected(d.subscriptions.setVcOwner(vcid, owner.address, {from: owner.address}));

    r = await d.subscriptions.setVcOwner(vcid, owner.address, {from: newOwner.address});
    expect(r).to.have.a.vcOwnerChangedEvent({
      vcid,
      previousOwner: newOwner.address,
      newOwner: owner.address
    });

  });



});

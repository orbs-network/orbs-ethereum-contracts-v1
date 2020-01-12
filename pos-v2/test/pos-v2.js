const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));

const {Driver, expectBNArrayEqual, expectRejected} = require("./driver");

const expect = chai.expect;



contract('pos-v2-high-level-flows', async () => {

  it('handle delegation requests', async () => {
    const d = await Driver.new();

    const d1 = await d.newParticipant();
    const d2 = await d.newParticipant();

    const r = await d1.delegate(d2);
    const l = d.delegatedEvents(r)[0];
    expect(l.from).to.equal(d1.address);
    expect(l.to).to.equal(d2.address);
  });

  it('sorts committee by stake', async () => {
    const d = await Driver.new(2);

    // First validator registers

    const validator = d.newParticipant();
    const V1_STAKE = 100;
    const s1 = await validator.stake(V1_STAKE);
    expect(d.stakedEvents(s1)).to.be.length(1);

    const r1 = await d.pos.registerValidator(validator.ip, {from: validator.address});
    const rl = d.validatorRegisteredEvents(r1)[0];
    expect(rl.addr).to.equal(validator.address);
    expect(rl.ip).to.equal(validator.ip);

    const cl = d.committeeChangedEvents(r1)[0];
    expect(cl.addrs).to.eql([validator.address]);
    expectBNArrayEqual(cl.stakes, [V1_STAKE]);

    // A second validator registers again

    const doublyStaked = d.newParticipant();
    const V2_STAKE = V1_STAKE * 2;
    const s2 = await doublyStaked.stake(V2_STAKE);
    expect(d.stakedEvents(s2)).to.be.length(1);

    const r2 = await d.pos.registerValidator(doublyStaked.ip, {from: doublyStaked.address});
    const rl2 = d.validatorRegisteredEvents(r2)[0];
    expect(rl2.addr).to.equal(doublyStaked.address);
    expect(rl2.ip).to.equal(doublyStaked.ip);

    const cl2 = d.committeeChangedEvents(r2)[0];
    expect(cl2.addrs).to.eql([doublyStaked.address, validator.address]);
    expectBNArrayEqual(cl2.stakes, [V2_STAKE, V1_STAKE]);

    // A third validator registers high ranked

    const triplyStaked = d.newParticipant();
    const V3_STAKE = V1_STAKE * 3;
    const s3 = await triplyStaked.stake(V3_STAKE);
    expect(d.stakedEvents(s3)).to.be.length(1);

    const r3 = await d.pos.registerValidator(triplyStaked.ip, {from: triplyStaked.address});

    const rl3 = d.validatorRegisteredEvents(r3)[0];
    expect(rl3.addr).to.equal(triplyStaked.address);
    expect(rl3.ip).to.equal(triplyStaked.ip);

    const cl3 = d.committeeChangedEvents(r3)[0];
    expect(cl3.addrs).to.eql([triplyStaked.address, doublyStaked.address]);
    expectBNArrayEqual(cl3.stakes, [V3_STAKE, V2_STAKE]);

    const delegator = d.newParticipant();
    const stakeAddition = new BN(cl3.stakes[0]).add(new BN(1));
    await delegator.stake(stakeAddition);
    const r4 = await delegator.delegate(doublyStaked);
    const cl4 = d.committeeChangedEvents(r4).pop();
    expect(cl4.addrs).to.eql([doublyStaked.address, triplyStaked.address]);
    expectBNArrayEqual(cl4.stakes, [new BN(V2_STAKE).add(stakeAddition), V3_STAKE]);

    const delegator2 = d.newParticipant();
    await delegator2.stake(stakeAddition);
    await delegator2.stake(stakeAddition);
    const r5 = await delegator2.delegate(validator);
    const cl5 = d.committeeChangedEvents(r5).pop();
    expect(cl5.addrs).to.eql([validator.address, doublyStaked.address]);
    expectBNArrayEqual(cl5.stakes, [new BN(V1_STAKE).add(stakeAddition).add(stakeAddition), new BN(V2_STAKE).add(stakeAddition)]);
  });

});

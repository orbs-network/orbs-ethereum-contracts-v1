const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));
const {Driver, expectBNArrayEqual, expectRejected} = require("./driver");

const expect = chai.expect;



contract('pos-v2-high-level-flows', async () => {

  it('handle delegation requests', async () => {
    const d = await Driver.new();

    const d1 = await d.newParticipant();
    const d2 = await d.newParticipant();

    const r = await d1.delegate(d2);
    expect(r).to.have.a.delegatedEvent({
      from: d1.address,
      to: d2.address
    });
  });

  it('sorts committee by stake', async () => {
    const d = await Driver.new(2);

    // First validator registers

    const validator = d.newParticipant();
    const V1_STAKE = new BN(100);
    let r = await validator.stake(V1_STAKE);
    expect(d.stakedEvents(r)).to.be.length(1);

    r = await d.pos.registerValidator(validator.ip, {from: validator.address});
    expect(r).to.have.a.validatorRegisteredEvent({
      addr: validator.address,
      ip: validator.ip
    });
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validator.address],
      stakes: [V1_STAKE],
    });

    const doublyStaked = d.newParticipant();
    const V2_STAKE = V1_STAKE.mul(new BN(2));
    r = await doublyStaked.stake(V2_STAKE);
    expect(r).to.have.a.stakedEvent();

    r = await d.pos.registerValidator(doublyStaked.ip, {from: doublyStaked.address});
    expect(r).to.have.a.validatorRegisteredEvent({
      addr: doublyStaked.address,
      ip: doublyStaked.ip,
    });
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [doublyStaked.address, validator.address],
      stakes: [V2_STAKE, V1_STAKE]
    });

    // A third validator registers high ranked

    const triplyStaked = d.newParticipant();
    const V3_STAKE = V1_STAKE.mul(new BN(3));
    r = await triplyStaked.stake(V3_STAKE);
    expect(r).to.have.a.stakedEvent();

    r = await d.pos.registerValidator(triplyStaked.ip, {from: triplyStaked.address});
    expect(r).to.have.a.validatorRegisteredEvent({
      addr: triplyStaked.address,
      ip: triplyStaked.ip
    });
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [triplyStaked.address, doublyStaked.address],
      stakes: [V3_STAKE, V2_STAKE]
    });

    const delegator = d.newParticipant();
    const stakeAddition = V3_STAKE.add(new BN(1));
    await delegator.stake(stakeAddition);
    r = await delegator.delegate(doublyStaked);
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [doublyStaked.address, triplyStaked.address],
      stakes: [new BN(V2_STAKE).add(stakeAddition), V3_STAKE]
    });

    const delegator2 = d.newParticipant();
    await delegator2.stake(stakeAddition);
    await delegator2.stake(stakeAddition);
    r = await delegator2.delegate(validator);
    expect(r).to.have.a.committeeChangedEvent({
      addrs: [validator.address, doublyStaked.address],
      stakes: [new BN(V1_STAKE).add(stakeAddition).add(stakeAddition), new BN(V2_STAKE).add(stakeAddition)]
    });
  });

});

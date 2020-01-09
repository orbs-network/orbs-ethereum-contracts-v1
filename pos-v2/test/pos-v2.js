const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));

const expect = chai.expect;

class Driver {

  constructor(pos, erc20, staking) {
    this.pos = pos;
    this.erc20 = erc20;
    this.staking = staking;
  }

  static async new() {
    const pos = await artifacts.require("PosV2").new();
    const erc20 = await artifacts.require('TestingERC20').new();
    const staking = await artifacts.require("StakingContract").new(1 /* _cooldownPeriodInSec */, "0x0000000000000000000000000000000000000001" /* _migrationManager */, "0x0000000000000000000000000000000000000001" /* _emergencyManager */, pos.address /* IStakingListener */, erc20.address /* _token */);

    return new Driver(pos, erc20, staking);
  }

  committeeChangedEvents(txResult) {
    const inputs = this.pos.abi.find(e => e.name == "CommitteeChanged").inputs;
    const eventSignature = "CommitteeChanged(address[],uint256[])";

    return this._parseEvents(txResult, inputs, eventSignature)
  }

  validatorRegisteredEvents(txResult) {
    const inputs = this.pos.abi.find(e => e.name == "ValidatorRegistered").inputs;
    const eventSignature = "ValidatorRegistered(address,bytes4)";

    return this._parseEvents(txResult, inputs, eventSignature)
  }

  stakedEvents(txResult) {
    const inputs = this.staking.abi.find(e => e.name == "Staked").inputs;
    const eventSignature = "Staked(address,uint256,uint256)";

    return this._parseEvents(txResult, inputs, eventSignature)
  }

  _parseEvents(txResult, inputs, eventSignature) {
    const eventSignatureHash = web3.eth.abi.encodeEventSignature(eventSignature);
    return txResult.receipt.rawLogs
        .filter(rl => rl.topics[0] === eventSignatureHash)
        .map(rawLog => web3.eth.abi.decodeLog(inputs, rawLog.data, rawLog.topics.slice(1) /*assume all events are non-anonymous*/));
  }

}

class Validator {

  constructor(address, driver) {
    this.ip = address.substring(0, 10).toLowerCase();

    this.address = address;
    this.erc20 = driver.erc20;
    this.staking = driver.staking;
  }

  async stake(amount) {
    await this.erc20.assign(this.address, amount);
    await this.erc20.approve(this.staking.address, amount, {from: this.address});
    return await this.staking.stake(amount, {from: this.address});
  }

}

function expectBNArrayEqual(a1, a2) {
  expect(a1).to.be.length(a2.length);
  a1.forEach((v, i) => {
    expect(new BN(a1[i])).to.be.bignumber.equal(new BN(a2[i]));
  });
}

async function expectRejected(promise) {
  let e = null;
  try {
    await promise;
  } catch (err) {
    e = err;
  }
  expect(e).to.exist; // TODO - verify correct error msg
}

contract('pos-v2', async (accounts) => {

  it('does not elect without registration', async() => {
    const d = await Driver.new();

    const newValidator = () => new Validator(accounts[0], d);

    const V1_STAKE = 100;

    const v1 = newValidator();
    const r1 = await v1.stake(V1_STAKE);

    expect(d.committeeChangedEvents(r1)).to.be.length(0);
  });

  it('a validator should not be able to register twice', async() => {
    const d = await Driver.new();

    let validatorCount = 0;
    const newValidator = () => new Validator(accounts[validatorCount++], d);

    // Validator registers

    const v1 = newValidator();
    const r1 = await d.pos.registerValidator(v1.ip, {from: v1.address});

    const rl = d.validatorRegisteredEvents(r1)[0];
    expect(rl.addr).to.equal(v1.address);
    expect(rl.ip).to.equal(v1.ip);

    const cl = d.committeeChangedEvents(r1)[0];
    expect(cl.addrs).to.eql([v1.address]);
    // expect(cl.stakes).to.eql([new BN(0)]);
    expectBNArrayEqual(cl.stakes, [0]);

    // The first validator attempts to register again - should not emit events
    await expectRejected(d.pos.registerValidator(v1.ip, {from: v1.address}));
  });

  it('should register a new validator', async () => {
    const d = await Driver.new();

    let validatorCount = 0;
    const newValidator = () => new Validator(accounts[validatorCount++], d);

    // First validator registers

    const validator = newValidator();
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

    const doublyStaked = newValidator();
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
  });

});

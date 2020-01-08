const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));

const expect = chai.expect;

const PosV2 = artifacts.require("PosV2");
const StakingContract = artifacts.require("StakingContract");
const ERC20 = artifacts.require("TestingERC20");


class Validator {

  constructor(address, erc20, staking) {
    this.ip = address.substring(0, 10).toLowerCase();

    this.address = address;
    this.erc20 = erc20;
    this.staking = staking;
  }

  async stake(amount) {
    await this.erc20.assign(this.address, amount);
    await this.erc20.approve(this.staking.address, amount);
    return await this.staking.stake(amount, {from: this.address});
  }

}

function expectBNArrayEqual(a1, a2) {
  expect(a1).to.be.length(a2.length);
  a1.forEach((v, i) => {
    expect(new BN(a1[i])).to.be.bignumber.equal(new BN(a2[i]));
  });
}

contract('pos-v2', async (accounts) => {

  it('should register a new validator', async () => {
    const pos = await PosV2.deployed();
    const erc20 = await ERC20.deployed();
    const staking = await StakingContract.deployed();

    let validatorCount = 0;
    const newValidator = () => new Validator(accounts[validatorCount++], erc20, staking);

    // First validator registers

    const v1 = newValidator();
    const V1_STAKE = 100;
    const s1 = await v1.stake(V1_STAKE);
    expect(s1.logs[0].event).to.equal('Staked');

    const r1 = await pos.registerValidator(v1.ip, {from: v1.address});

    const rl = r1.logs[0];
    expect(rl.event).to.equal('ValidatorRegistered');
    expect(rl.args.addr).to.equal(v1.address);
    expect(rl.args.ip).to.equal(v1.ip);

    const cl = r1.logs[1];
    expect(cl.event).to.equal('CommitteeEvent');
    expect(cl.args.addrs).to.eql([v1.address]);
    // expect(cl.args.stakes).to.eql([new BN(0)]);
    expectBNArrayEqual(cl.args.stakes, [V1_STAKE]);

    // A second validator registers again

    const v2 = newValidator();
    const r2 = await pos.registerValidator(v2.ip, {from: v2.address});

    const rl2 = r2.logs[0];
    expect(rl2.event).to.equal('ValidatorRegistered');
    expect(rl2.args.addr).to.equal(v2.address);
    expect(rl2.args.ip).to.equal(v2.ip);

    const cl2 = r2.logs[1];
    expect(cl2.event).to.equal('CommitteeEvent');
    expect(cl2.args.addrs).to.eql([v1.address, v2.address]);
    // expect(cl.args.stakes).to.eql([new BN(0), new BN(0)]);
    expectBNArrayEqual(cl2.args.stakes, [V1_STAKE, 0]);


    // // The second validator attempts to register again - should not emit events
    // const r3 = await pos.registerValidator(v2.ip, {from: v2.address});
    // expect(r3.logs.length).to.equal(0);
  });

});

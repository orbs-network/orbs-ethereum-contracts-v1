import chai from 'chai';
import dirtyChai from 'dirty-chai';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;
chai.use(dirtyChai);

const AutonomousSwapBridge = artifacts.require('./AutonomousSwapBridge.sol');
const Federation = artifacts.require('./Federation.sol');
const TokenMock = artifacts.require('./OrbsTokenMock.sol');

contract('AutonomousSwapBridge', (accounts) => {
  const VIRTUAL_CHAIN_ID = 0x6b696e;
  const ORBS_ASB_CONTRACT_NAME = 'asb';
  const VERSION = '0.1';
  const EMPTY = '';
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const owner = accounts[0];

  let token;
  let federation;

  beforeEach(async () => {
    token = await TokenMock.new();

    const federationMembers = accounts.slice(7, 10);
    federation = await Federation.new(federationMembers, { from: owner });
  });

  describe('construction', async () => {
    it('should not allow to create with an empty Orbs ASB contract name', async () => {
      await expectRevert(AutonomousSwapBridge.new(VIRTUAL_CHAIN_ID, EMPTY, token.address, federation.address,
        { from: owner }));
    });

    it('should not allow to create with a 0x0 token', async () => {
      await expectRevert(AutonomousSwapBridge.new(VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, ZERO_ADDRESS,
        federation.address, { from: owner }));
    });

    it('should not allow to create with a 0x0 federation', async () => {
      await expectRevert(AutonomousSwapBridge.new(VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        ZERO_ADDRESS, { from: owner }));
    });

    it('should correctly initialize fields', async () => {
      const asb = await AutonomousSwapBridge.new(VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, { from: owner });

      expect(await asb.virtualChainId.call()).to.be.bignumber.equal(VIRTUAL_CHAIN_ID);
      expect(await asb.orbsASBContractName.call()).to.be.equal(ORBS_ASB_CONTRACT_NAME);
      expect(await asb.token.call()).to.eql(token.address);
      expect(await asb.federation.call()).to.eql(federation.address);
    });

    it('should report version', async () => {
      const asb = await AutonomousSwapBridge.new(VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, { from: owner });

      expect(await asb.VERSION.call()).to.be.bignumber.equal(VERSION);
    });
  });

  describe('transfer tokens to Orbs', async () => {
    let asb;
    const initialBalance = 100000;
    const user1 = accounts[3];
    const user2 = accounts[4];
    const user3 = accounts[5];
    const orbsUser1Address = '0x1fad2e43de9d6b4d8b0711f499b7b1b445170b6a';
    const orbsUser2Address = '0x02786db0e65e76bd8043031f6a6292cbc763d010';
    const orbsUser3Address = '0x99a8487019099bee8af8473134fa247c2f018790';

    beforeEach(async () => {
      asb = await AutonomousSwapBridge.new(VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, { from: owner });

      await token.assign(user1, initialBalance);
      await token.assign(user2, initialBalance);
      await token.assign(user3, initialBalance);
    });

    it('should transfer out tokens', async () => {
      const value = 100;
      await token.approve(asb.address, value, { from: user1 });

      const asbBalance = await token.balanceOf(asb.address);
      const tx = await asb.transferOut(orbsUser1Address, value, { from: user1 });

      expect(tx.logs).to.have.length(1);
      const event = tx.logs[0];
      expect(event.event).to.eql('TransferredOut');
      expect(event.args.from).to.eql(user1);
      expect(event.args.to).to.eql(orbsUser1Address);
      expect(event.args.value).to.be.bignumber.equal(value);
      expect(event.args.tuid).to.be.bignumber.equal(1);

      expect(await token.balanceOf(asb.address)).to.be.bignumber.equal(asbBalance.plus(value));
    });

    it('should transfer out tokens more than once', async () => {
      const value = 1000;
      await token.approve(asb.address, value, { from: user1 });

      const times = 20;
      for (let i = 0; i < times; ++i) {
        const asbBalance = await token.balanceOf(asb.address);
        const tx = await asb.transferOut(orbsUser1Address, value / times, { from: user1 });
        expect(tx.logs).to.have.length(1);
        const event = tx.logs[0];
        expect(event.event).to.eql('TransferredOut');
        expect(event.args.from).to.eql(user1);
        expect(event.args.to).to.eql(orbsUser1Address);
        expect(event.args.value).to.be.bignumber.equal(value / times);
        expect(event.args.tuid).to.be.bignumber.equal(i + 1);

        expect(await token.balanceOf(asb.address)).to.be.bignumber.equal(asbBalance.plus(value / times));
      }
    });

    it('should transfer out tokens from multiple token holders', async () => {
      const value = 10000;
      [user1, user2, user3].forEach(async (user) => {
        await token.approve(asb.address, value, { from: user });
      });

      const scenarios = [
        { from: user1, to: orbsUser1Address, value: 200 },
        { from: user2, to: orbsUser2Address, value: 30 },
        { from: user2, to: orbsUser3Address, value: 570 },
        { from: user3, to: orbsUser1Address, value: 5 },
        { from: user3, to: orbsUser2Address, value: 58 },
        { from: user1, to: orbsUser3Address, value: 111 },
        { from: user2, to: orbsUser1Address, value: 899 },
        { from: user3, to: orbsUser2Address, value: 1000 },
      ];

      for (let i = 0; i < scenarios.length; ++i) {
        const spec = scenarios[i];

        const asbBalance = await token.balanceOf(asb.address);

        const tx = await asb.transferOut(spec.to, spec.value, { from: spec.from });
        expect(tx.logs).to.have.length(1);
        const event = tx.logs[0];
        expect(event.event).to.eql('TransferredOut');
        expect(event.args.from).to.eql(spec.from);
        expect(event.args.to).to.eql(spec.to);
        expect(event.args.value).to.be.bignumber.equal(spec.value);
        expect(event.args.tuid).to.be.bignumber.equal(i + 1);

        expect(await token.balanceOf(asb.address)).to.be.bignumber.equal(asbBalance.plus(spec.value));
      }
    });

    it('should not allow to transfer out more than allowed tokens', async () => {
      const value = 100;
      await token.approve(asb.address, value, { from: user1 });

      await expectRevert(asb.transferOut(orbsUser1Address, value + 1, { from: user1 }));
    });

    it('should not allow to transfer out more than the tokens that the user holds', async () => {
      const value = initialBalance + 1000;
      await token.approve(asb.address, value, { from: user1 });

      await expectRevert(asb.transferOut(orbsUser1Address, value, { from: user1 }));
    });

    it('should not allow to transfer to an empty Orbs address', async () => {
      const value = 100;
      await token.approve(asb.address, value, { from: user1 });

      await expectRevert(asb.transferOut(EMPTY, value, { from: user1 }));
    });

    it('should not allow to transfer 0 tokens', async () => {
      const value = 100;
      await token.approve(asb.address, value, { from: user1 });

      await expectRevert(asb.transferOut(orbsUser1Address, 0, { from: user1 }));
    });
  });
});

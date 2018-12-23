import chai from 'chai';

import ASBProof from './helpers/asbProof';
import expectRevert from './helpers/expectRevert';

const { expect } = chai;

const AutonomousSwapBridge = artifacts.require('./AutonomousSwapBridge.sol');
const AutonomousSwapProofVerifier = artifacts.require('./AutonomousSwapProofVerifier.sol');
const Federation = artifacts.require('./Federation.sol');
const TokenMock = artifacts.require('./OrbsTokenMock.sol');

const TEST_ACCOUNTS = require('./accounts.json');

contract('AutonomousSwapBridge', (accounts) => {
  const NETWORK_TYPE = 0;
  const VIRTUAL_CHAIN_ID = 0x6b696e;
  const ORBS_ASB_CONTRACT_NAME = 'asb';
  const PROTOCOL_VERSION = 1;
  const ORBS_ADDRESS = 'ef0ee8a2ba59624e227f6ac0a85e6aa5e75df86a';
  const TRANSFERED_OUT_EVENT_NAME = 'TransferredOut';
  const VERSION = 1;
  const EMPTY = '';
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  const owner = accounts[0];
  const notOwner = accounts[1];

  let token;

  beforeEach(async () => {
    token = await TokenMock.new();
  });

  describe('construction', async () => {
    let federation;
    let verifier;

    beforeEach(async () => {
      const federationMembers = accounts.slice(7, 10);
      federation = await Federation.new(federationMembers, { from: owner });
      verifier = await AutonomousSwapProofVerifier.new(federation.address);
    });

    it('should not allow to create with an empty Orbs ASB contract name', async () => {
      await expectRevert(AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, EMPTY, token.address,
        federation.address, verifier.address, { from: owner }));
    });

    it('should not allow to create with a 0x0 token', async () => {
      await expectRevert(AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME,
        ZERO_ADDRESS, verifier.address, federation.address, { from: owner }));
    });

    it('should not allow to create with a 0x0 federation', async () => {
      await expectRevert(AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME,
        token.address, ZERO_ADDRESS, verifier.address, { from: owner }));
    });

    it('should not allow to create with a 0x0 verifier', async () => {
      await expectRevert(AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, ZERO_ADDRESS, { from: owner }));
    });

    it('should correctly initialize fields', async () => {
      const asb = await AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, verifier.address, { from: owner });

      expect(await asb.networkType.call()).to.be.bignumber.equal(NETWORK_TYPE);
      expect(await asb.virtualChainId.call()).to.be.bignumber.equal(VIRTUAL_CHAIN_ID);
      expect(await asb.orbsASBContractName.call()).to.be.equal(ORBS_ASB_CONTRACT_NAME);
      expect(await asb.token.call()).to.eql(token.address);
      expect(await asb.federation.call()).to.eql(federation.address);
      expect(await asb.verifier.call()).to.eql(verifier.address);
    });

    it('should report version', async () => {
      const asb = await AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, verifier.address, { from: owner });

      expect(await asb.VERSION.call()).to.be.bignumber.equal(VERSION);
    });
  });

  describe('upgrade', async () => {
    let federation;
    let asb;

    beforeEach(async () => {
      const federationMemberAccounts = TEST_ACCOUNTS.slice(0, 10);
      const federationMembersAddresses = federationMemberAccounts.map(account => account.address);
      federation = await Federation.new(federationMembersAddresses, { from: owner });
      const verifier = await AutonomousSwapProofVerifier.new(federation.address);
      asb = await AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, verifier.address, { from: owner });
    });

    describe('ASB proof verifier', async () => {
      context('owner', async () => {
        it('should allow to upgrade', async () => {
          const newVerifier = await AutonomousSwapProofVerifier.new(federation.address);
          expect(await asb.verifier()).to.not.eql(newVerifier.address);

          await asb.setAutonomousSwapProofVerifier(newVerifier.address, { from: owner });
          expect(await asb.verifier()).to.eql(newVerifier.address);
        });

        it('should not allow to upgrade to a 0x0 verifier', async () => {
          expectRevert(asb.setAutonomousSwapProofVerifier(ZERO_ADDRESS, { from: owner }));
        });
      });

      context('not an owner', async () => {
        it('should not allow to upgrade', async () => {
          const newVerifier = await AutonomousSwapProofVerifier.new(federation.address);
          await expectRevert(asb.setAutonomousSwapProofVerifier(newVerifier.address, { from: notOwner }));
        });
      });
    });
  });

  describe('transfer tokens to Orbs', async () => {
    const initialBalance = 100000;
    const user1 = accounts[3];
    const user2 = accounts[4];
    const user3 = accounts[5];
    const orbsUser1Address = '0x1fad2e43de9d6b4d8b0711f499b7b1b445170b6a';
    const orbsUser2Address = '0x02786db0e65e76bd8043031f6a6292cbc763d010';
    const orbsUser3Address = '0x99a8487019099bee8af8473134fa247c2f018790';

    let asb;
    let federation;
    let verifier;

    beforeEach(async () => {
      const federationMembers = accounts.slice(7, 10);
      federation = await Federation.new(federationMembers, { from: owner });
      verifier = await AutonomousSwapProofVerifier.new(federation.address);
      asb = await AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, verifier.address, { from: owner });

      await token.assign(user1, initialBalance);
      await token.assign(user2, initialBalance);
      await token.assign(user3, initialBalance);
    });

    it('should transfer out tokens', async () => {
      const value = 100;
      await token.approve(asb.address, value, { from: user1 });

      const asbBalance = await token.balanceOf.call(asb.address);
      const tx = await asb.transferOut(orbsUser1Address, value, { from: user1 });

      expect(tx.logs).to.have.length(1);
      const event = tx.logs[0];
      expect(event.event).to.eql('TransferredOut');
      expect(event.args.from).to.eql(user1);
      expect(event.args.to).to.eql(orbsUser1Address);
      expect(event.args.value).to.be.bignumber.equal(value);
      expect(event.args.tuid).to.be.bignumber.equal(1);

      expect(await token.balanceOf.call(asb.address)).to.be.bignumber.equal(asbBalance.plus(value));
    });

    it('should transfer out tokens more than once', async () => {
      const value = 1000;
      await token.approve(asb.address, value, { from: user1 });

      const times = 20;
      for (let i = 0; i < times; ++i) {
        const asbBalance = await token.balanceOf.call(asb.address);
        const tx = await asb.transferOut(orbsUser1Address, value / times, { from: user1 });
        expect(tx.logs).to.have.length(1);
        const event = tx.logs[0];
        expect(event.event).to.eql('TransferredOut');
        expect(event.args.from).to.eql(user1);
        expect(event.args.to).to.eql(orbsUser1Address);
        expect(event.args.value).to.be.bignumber.equal(value / times);
        expect(event.args.tuid).to.be.bignumber.equal(i + 1);

        expect(await token.balanceOf.call(asb.address)).to.be.bignumber.equal(asbBalance.plus(value / times));
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

        const asbBalance = await token.balanceOf.call(asb.address);

        const tx = await asb.transferOut(spec.to, spec.value, { from: spec.from });
        expect(tx.logs).to.have.length(1);
        const event = tx.logs[0];
        expect(event.event).to.eql('TransferredOut');
        expect(event.args.from).to.eql(spec.from);
        expect(event.args.to).to.eql(spec.to);
        expect(event.args.value).to.be.bignumber.equal(spec.value);
        expect(event.args.tuid).to.be.bignumber.equal(i + 1);

        expect(await token.balanceOf.call(asb.address)).to.be.bignumber.equal(asbBalance.plus(spec.value));
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

  describe('transfer tokens from Orbs', async () => {
    const initialASBBalance = 1000000;
    const value = 1000;
    const receiver = accounts[5];
    const tuid = 12;

    let asb;
    let federation;
    let verifier;
    let federationMemberAccounts;
    let proof;

    beforeEach(async () => {
      federationMemberAccounts = TEST_ACCOUNTS.slice(0, 10);
      const federationMembersAddresses = federationMemberAccounts.map(account => account.address);
      federation = await Federation.new(federationMembersAddresses, { from: owner });
      verifier = await AutonomousSwapProofVerifier.new(federation.address);
      asb = await AutonomousSwapBridge.new(NETWORK_TYPE, VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, verifier.address, { from: owner });
      await token.assign(asb.address, initialASBBalance);

      expect(await token.balanceOf.call(receiver)).to.be.bignumber.equal(0);
      expect(await token.balanceOf.call(asb.address)).to.be.bignumber.equal(initialASBBalance);

      proof = (new ASBProof())
        .setFederationMemberAccounts(federationMemberAccounts)
        .setOrbsContractName(ORBS_ASB_CONTRACT_NAME)
        .setEventName(TRANSFERED_OUT_EVENT_NAME)
        .setTuid(tuid)
        .setOrbsAddress(ORBS_ADDRESS)
        .setEthereumAddress(receiver)
        .setValue(value)
        .setTransactionExecutionResult(1)
        .setTransactionReceipts(['transaction1', 'transaction2', 5, 4, 3])
        .setProtocolVersion(PROTOCOL_VERSION)
        .setVirtualChainId(VIRTUAL_CHAIN_ID)
        .setNetworkType(NETWORK_TYPE)
        .setTimestamp(Math.floor((new Date()).getTime() / 1000))
        .setBlockProofVersion(0);
    });

    const transferIn = async (asbProof) => {
      const rawProof = asbProof.getPackedProof();
      return asb.transferIn(rawProof.packedProof, rawProof.transactionReceipt);
    };

    context('valid', async () => {
      it('should transfer tokens', async () => {
        const tx = await transferIn(proof);
        const event = tx.logs[0];
        expect(event.event).to.eql('TransferredIn');
        expect(event.args.from).to.eql(`0x${ORBS_ADDRESS}`);
        expect(event.args.to).to.eql(receiver);
        expect(event.args.value).to.be.bignumber.equal(value);
        expect(event.args.tuid).to.be.bignumber.equal(tuid);
      });

      context('double spend', async () => {
        beforeEach(async () => {
          await transferIn(proof);
        });

        it('should revert', async () => {
          await expectRevert(transferIn(proof));
        });
      });

      afterEach(async () => {
        expect(await token.balanceOf.call(receiver)).to.be.bignumber.equal(value);
        expect(await token.balanceOf.call(asb.address)).to.be.bignumber.equal(initialASBBalance - value);
      });
    });

    context('invalid', async () => {
      afterEach(async () => {
        await expectRevert(transferIn(proof));

        expect(await token.balanceOf.call(receiver)).to.be.bignumber.equal(0);
        expect(await token.balanceOf.call(asb.address)).to.be.bignumber.equal(initialASBBalance);
      });

    //   context('incorrect network type', async () => {
    //     it('should revert', async () => {
    //       proof.setNetworkType(NETWORK_TYPE + 10);
    //     });
    //   });

      context('incorrect virtual chain ID', async () => {
        it('should revert', async () => {
          proof.setVirtualChainId(VIRTUAL_CHAIN_ID + 100);
        });
      });

      context('incorrect Orbs smart contract', async () => {
        it('should revert', async () => {
          proof.setOrbsContractName(`not${ORBS_ASB_CONTRACT_NAME}`);
        });
      });

      context('incorrect destination', async () => {
        it('should revert', async () => {
          proof.setEthereumAddress(ZERO_ADDRESS);
        });
      });

      context('incorrect value', async () => {
        it('should revert', async () => {
          proof.setValue(0);
        });
      });

      context('requesting too many tokens', async () => {
        it('should revert', async () => {
          proof.setValue(initialASBBalance + 1);
        });
      });
    });
  });
});

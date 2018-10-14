import chai from 'chai';
import dirtyChai from 'dirty-chai';
import assertArrays from 'chai-arrays';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;

chai.use(assertArrays);
chai.use(dirtyChai);

const TEST_ACCOUNTS = require('./accounts.json').accounts;

const Federation = artifacts.require('./Federation.sol');
const OrbsTokenMock = artifacts.require('./OrbsTokenMock.sol');
const SubscriptionManagerMock = artifacts.require('./SubscriptionManagerMock.sol');

contract('Federation', (accounts) => {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const VERSION = '0.1';
  const MAX_FEDERATION_MEMBERS = 100;

  describe('construction', async () => {
    const members = [accounts[7], accounts[8], accounts[9]];

    it('should not allow to initialize with an empty array of federation members', async () => {
      await expectRevert(Federation.new([]));
    });

    it('should not allow to initialize with too many federation members', async () => {
      const tooManyCooks = TEST_ACCOUNTS.slice(0, MAX_FEDERATION_MEMBERS + 1);
      expect(tooManyCooks).to.have.length.above(MAX_FEDERATION_MEMBERS);

      await expectRevert(Federation.new(tooManyCooks));
    });

    it('should allow to initialize with maximum federation members', async () => {
      await Federation.new(TEST_ACCOUNTS.slice(0, MAX_FEDERATION_MEMBERS));
    });

    it('should not allow to initialize with 0x0 address federation members', async () => {
      let invalidFederationMembers = [accounts[7], accounts[8], ZERO_ADDRESS, accounts[9]];

      await expectRevert(Federation.new(invalidFederationMembers));

      invalidFederationMembers = [accounts[7], accounts[8], accounts[9], ZERO_ADDRESS];

      await expectRevert(Federation.new(invalidFederationMembers));
    });

    it('should not allow to initialize with duplicate federation members', async () => {
      const duplicateMembers = [accounts[1], accounts[0], accounts[1], accounts[3]];

      await expectRevert(Federation.new(duplicateMembers));
    });

    it('should report version', async () => {
      const federation = await Federation.new(members);

      expect(await federation.VERSION.call()).to.be.bignumber.equal(VERSION);
    });

    it('should initialize state variables', async () => {
      const federation = await Federation.new(members);
      expect(await federation.getMembers.call()).to.be.equalTo(members);
      expect(await federation.subscriptionManager.call()).to.eql(ZERO_ADDRESS);
    });
  });

  describe('management', async () => {
    const owner = accounts[0];
    const notOwner = accounts[1];

    describe('add member', async () => {
      context('as an owner', async () => {
        it('should add a member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const newMember = accounts[1];
          const tx = await federation.addMember(newMember);
          expect(await federation.getMembers.call()).to.be.containing(newMember);
          expect(tx.logs).to.have.length(1);
          const event = tx.logs[0];
          expect(event.event).to.eql('MemberAdded');
          expect(event.args.member).to.eql(newMember);

          const newMember2 = accounts[2];
          const tx2 = await federation.addMember(newMember2);
          expect(await federation.getMembers.call()).to.be.containing(newMember2);
          expect(tx2.logs).to.have.length(1);
          const event2 = tx2.logs[0];
          expect(event2.event).to.eql('MemberAdded');
          expect(event2.args.member).to.eql(newMember2);
        });

        it('should not allow to add a more than the maximum possible members', async () => {
          const members = TEST_ACCOUNTS.slice(0, MAX_FEDERATION_MEMBERS - 1);
          const federation = await Federation.new(members, { from: owner });

          const newMember = TEST_ACCOUNTS[MAX_FEDERATION_MEMBERS - 1];
          await federation.addMember(newMember);
          expect(await federation.getMembers.call()).to.be.containing(newMember);

          const newMember2 = TEST_ACCOUNTS[MAX_FEDERATION_MEMBERS];
          await expectRevert(federation.addMember(newMember2));
        });

        it('should not allow to add a 0x0 member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          await expectRevert(federation.addMember(ZERO_ADDRESS));
        });

        it('should not allow to add an existing member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          await expectRevert(federation.addMember(members[1]));
        });
      });

      context('as not an owner', async () => {
        it('should not allow to add a member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const newMember = accounts[2];
          await expectRevert(federation.addMember(newMember, { from: notOwner }));
        });
      });
    });

    describe('remove member', async () => {
      context('owner', async () => {
        it('should remove a member', async () => {
          const members = [accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const existingMember = members[0];
          const tx = await federation.removeMember(existingMember);
          expect(await federation.getMembers.call()).not.to.be.containing(existingMember);
          expect(tx.logs).to.have.length(1);
          const event = tx.logs[0];
          expect(event.event).to.eql('MemberRemoved');
          expect(event.args.member).to.eql(existingMember);

          const existingMember2 = members[4];
          const tx2 = await federation.removeMember(existingMember2);
          expect(await federation.getMembers.call()).not.to.be.containing(existingMember2);
          expect(tx2.logs).to.have.length(1);
          const event2 = tx2.logs[0];
          expect(event2.event).to.eql('MemberRemoved');
          expect(event2.args.member).to.eql(existingMember2);
        });

        it('should not allow to remove all the members', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          await federation.removeMember(members[0]);
          await federation.removeMember(members[1]);

          expect(await federation.getMembers.call()).to.equalTo([members[2]]);
          await expectRevert(federation.removeMember(members[2]));
        });

        it('should not allow to remove a 0x0 member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          await expectRevert(federation.removeMember(ZERO_ADDRESS));
        });

        it('should not allow to remove a non-existing member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const nonMember = accounts[5];
          expect(await federation.getMembers.call()).not.to.be.containing(nonMember);
          await expectRevert(federation.removeMember(nonMember));
        });
      });

      context('not an owner', async () => {
        it('should not allow to remove a member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const existingMember = members[2];
          await expectRevert(federation.removeMember(existingMember, { from: notOwner }));
        });
      });
    });

    describe('upgrade subscription manager', async () => {
      const buildSubscriptionManager = async (token, federation) => {
        const minimalMonthlySubscription = 100;

        const manager = await SubscriptionManagerMock.new(token.address, federation.address, minimalMonthlySubscription,
          { from: owner });
        await manager.transferOwnership(federation.address);

        return manager;
      };

      const getUpgradeContext = async (manager) => {
        const context = await manager.upgradeContext.call();
        return { called: context[0], newContract: context[1] };
      };

      let token;
      let federation;
      let oldManager;

      beforeEach(async () => {
        token = await OrbsTokenMock.new();

        const members = [accounts[7], accounts[8], accounts[9]];
        federation = await Federation.new(members, { from: owner });

        oldManager = await buildSubscriptionManager(token, federation);
        await federation.upgradeSubscriptionManager(oldManager.address, { from: owner });
        expect(await federation.subscriptionManager.call()).to.eql(oldManager.address);
      });

      context('owner', async () => {
        it('should be able to use the upgrade method to initially set the subscription manager', async () => {
          const members = [accounts[1], accounts[2]];
          const initialFederation = await Federation.new(members, { from: owner });
          const newManager = await buildSubscriptionManager(token, federation);

          await initialFederation.upgradeSubscriptionManager(newManager.address, { from: owner });
          expect(await initialFederation.subscriptionManager.call()).to.eql(newManager.address);

          const upgradeContext = await getUpgradeContext(oldManager);
          expect(upgradeContext.called).to.be.false();
        });

        it('should upgrade the subscription manager', async () => {
          const newManager = await buildSubscriptionManager(token, federation);

          await federation.upgradeSubscriptionManager(newManager.address, { from: owner });
          expect(await federation.subscriptionManager.call()).to.eql(newManager.address);

          const upgradeContext = await getUpgradeContext(oldManager);
          expect(upgradeContext.called).to.be.true();
          expect(upgradeContext.newContract).to.be.eql(newManager.address);
        });

        it('should not allow to upgrade the subscription manager to a 0x0 address', async () => {
          await expectRevert(federation.upgradeSubscriptionManager(ZERO_ADDRESS, { from: owner }));
        });

        it('should not allow to upgrade the subscription manager to the same address', async () => {
          await expectRevert(federation.upgradeSubscriptionManager(oldManager.address, { from: owner }));
        });

        it('should not allow to upgrade the subscription manager with a different owner', async () => {
          const minimalMonthlySubscription = 100;
          const newManager = await SubscriptionManagerMock.new(token.address, federation.address,
            minimalMonthlySubscription, { from: notOwner });

          await expectRevert(federation.upgradeSubscriptionManager(newManager.address, { from: owner }));
        });

        it('should revert if the upgrade fails gracefully', async () => {
          await oldManager.setUpgradeFail(true);

          const newManager = await buildSubscriptionManager(token, federation);
          await expectRevert(federation.upgradeSubscriptionManager(newManager.address, { from: owner }));
        });

        it('should revert if the upgrade reverts', async () => {
          await oldManager.setUpgradeFail(false);

          const newManager = await buildSubscriptionManager(token, federation);
          await expectRevert(federation.upgradeSubscriptionManager(newManager.address, { from: owner }));
        });
      });

      context('not an owner', async () => {
        it('should not allow to upgrade the subscription manager', async () => {
          const newManager = await buildSubscriptionManager(token, federation);
          await expectRevert(federation.upgradeSubscriptionManager(newManager.address, { from: notOwner }));
        });
      });
    });
  });
});

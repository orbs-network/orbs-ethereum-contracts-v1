/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import chai from 'chai';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;

const TEST_ACCOUNTS = require('./accounts.json');

const TEST_ACCOUNTS_ADDRESSES = TEST_ACCOUNTS.map(account => account.address);

const Federation = artifacts.require('./Federation.sol');
const OrbsTokenMock = artifacts.require('./OrbsTokenMock.sol');
const SubscriptionManagerMock = artifacts.require('./SubscriptionManagerMock.sol');

contract('Federation', (accounts) => {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const VERSION = 1;
  const MAX_FEDERATION_MEMBERS = 100;

  describe('construction', async () => {
    const members = accounts.slice(7, 10);

    it('should not allow to initialize with an empty array of federation members', async () => {
      await expectRevert(Federation.new([]));
    });

    it('should not allow to initialize with too many federation members', async () => {
      const tooManyCooks = TEST_ACCOUNTS_ADDRESSES.slice(0, MAX_FEDERATION_MEMBERS + 1);
      expect(tooManyCooks).to.have.length.above(MAX_FEDERATION_MEMBERS);

      await expectRevert(Federation.new(tooManyCooks));
    });

    it('should allow to initialize with maximum federation members', async () => {
      await Federation.new(TEST_ACCOUNTS_ADDRESSES.slice(0, MAX_FEDERATION_MEMBERS));
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
      expect(await federation.getFederationRevision.call()).to.be.bignumber.equal(0);
    });
  });

  describe('management', async () => {
    const owner = accounts[0];
    const notOwner = accounts[1];

    describe('add member', async () => {
      context('as an owner', async () => {
        it('should add a member', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          const newMember = accounts[1];
          expect(await federation.isMember.call(newMember)).to.be.false();
          const tx = await federation.addMember(newMember);
          expect(await federation.getMembers.call()).to.be.containing(newMember);
          expect(tx.logs).to.have.length(1);
          const event = tx.logs[0];
          expect(event.event).to.eql('MemberAdded');
          expect(event.args.member).to.eql(newMember);
          expect(await federation.isMember.call(newMember)).to.be.true();

          const newMember2 = accounts[2];
          expect(await federation.isMember.call(newMember2)).to.be.false();
          const tx2 = await federation.addMember(newMember2);
          expect(await federation.getMembers.call()).to.be.containing(newMember2);
          expect(tx2.logs).to.have.length(1);
          const event2 = tx2.logs[0];
          expect(event2.event).to.eql('MemberAdded');
          expect(event2.args.member).to.eql(newMember2);
          expect(await federation.isMember.call(newMember2)).to.be.true();
        });

        it('should not allow to add a more than the maximum possible members', async () => {
          const members = TEST_ACCOUNTS_ADDRESSES.slice(0, MAX_FEDERATION_MEMBERS - 1);
          const federation = await Federation.new(members, { from: owner });

          const newMember = TEST_ACCOUNTS_ADDRESSES[MAX_FEDERATION_MEMBERS - 1];
          await federation.addMember(newMember);
          expect(await federation.getMembers.call()).to.be.containing(newMember);

          const newMember2 = TEST_ACCOUNTS_ADDRESSES[MAX_FEDERATION_MEMBERS];
          await expectRevert(federation.addMember(newMember2));
        });

        it('should not allow to add a 0x0 member', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          await expectRevert(federation.addMember(ZERO_ADDRESS));
        });

        it('should not allow to add an existing member', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          await expectRevert(federation.addMember(members[1]));
        });
      });

      context('as not an owner', async () => {
        it('should not allow to add a member', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          const newMember = accounts[2];
          await expectRevert(federation.addMember(newMember, { from: notOwner }));
        });
      });
    });

    describe('remove member', async () => {
      context('owner', async () => {
        it('should remove a member', async () => {
          const members = accounts.slice(4, 9);
          const federation = await Federation.new(members, { from: owner });

          const membersIndicesToRemove = [0, 2, members.length - 3];
          for (let i = 0; i < membersIndicesToRemove.length; ++i) {
            const index = membersIndicesToRemove[i];
            const existingMember = members[index];
            expect(await federation.isMember.call(existingMember)).to.be.true();
            members.splice(index, 1);
            const tx = await federation.removeMember(existingMember);
            expect(await federation.getMembers.call()).to.be.equalTo(members);
            expect(tx.logs).to.have.length(1);
            const event = tx.logs[0];
            expect(event.event).to.eql('MemberRemoved');
            expect(event.args.member).to.eql(existingMember);
            expect(await federation.isMember.call(existingMember)).to.be.false();
          }
        });

        it('should not allow to remove all the members', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          await federation.removeMember(members[0]);
          await federation.removeMember(members[1]);

          expect(await federation.getMembers.call()).to.equalTo([members[2]]);
          await expectRevert(federation.removeMember(members[2]));
        });

        it('should not allow to remove a 0x0 member', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          await expectRevert(federation.removeMember(ZERO_ADDRESS));
        });

        it('should not allow to remove a non-existing member', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          const nonMember = accounts[5];
          expect(await federation.isMember.call(nonMember)).to.be.false();
          expect(await federation.getMembers.call()).not.to.be.containing(nonMember);
          await expectRevert(federation.removeMember(nonMember));
        });

        it('should not allow to remove by out of range index', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          await expectRevert(federation.removeMemberByIndex(100));
        });
      });

      context('not an owner', async () => {
        it('should not allow to remove a member', async () => {
          const members = accounts.slice(7, 10);
          const federation = await Federation.new(members, { from: owner });

          const existingMember = members[2];
          await expectRevert(federation.removeMember(existingMember, { from: notOwner }));
        });
      });
    });

    describe('consensus threshold', async () => {
      [
        { members: 1, threshold: 1 },
        { members: 2, threshold: 2 },
        { members: 3, threshold: 2 },
        { members: 5, threshold: 4 },
        { members: 6, threshold: 4 },
        { members: 21, threshold: 14 },
        { members: 22, threshold: 15 },
        { members: 100, threshold: 67 },
      ].forEach((spec) => {
        let federation;

        beforeEach(async () => {
          federation = await Federation.new(TEST_ACCOUNTS_ADDRESSES.slice(0, spec.members), { from: owner });
        });

        it(`should return ${spec.threshold} for a federation of size ${spec.members}`, async () => {
          expect(await federation.getConsensusThreshold.call()).to.be.bignumber.equal(spec.threshold);
        });
      });
    });

    describe('federation revisions', async () => {
      it('should update revision and history after addition', async () => {
        const members = TEST_ACCOUNTS_ADDRESSES.slice(7, 20);
        const federation = await Federation.new(members, { from: owner });
        expect(await federation.getFederationRevision.call()).to.be.bignumber.equal(0);
        expect(await federation.getMembersByRevision.call(0)).to.be.equalTo(members);

        for (let i = 0; i < members.length; ++i) {
          expect(await federation.isMemberByRevision.call(0, members[i])).to.be.true();
        }

        const threshold = Math.ceil(members.length * 2 / 3);
        expect(await federation.getConsensusThreshold.call()).to.be.bignumber.equal(threshold);
        expect(await federation.getConsensusThresholdByRevision.call(0)).to.be.bignumber.equal(threshold);

        let prevMembers = members;
        const membersToAdd = TEST_ACCOUNTS_ADDRESSES.slice(30, 4);
        for (let i = 0; i < membersToAdd.length; ++i) {
          const newMember = membersToAdd[i];
          const newMembers = [...prevMembers, newMember];
          const prevThreshold = Math.ceil(prevMembers.length * 2 / 3);
          const newThreshold = Math.ceil(newMembers.length * 2 / 3);

          await federation.addMember(newMember);
          expect(await federation.getMembers.call()).to.be.equalTo(newMembers);
          expect(await federation.getFederationRevision.call()).to.be.bignumber.equal(i + 1);
          expect(await federation.getMembersByRevision.call(i)).to.be.equalTo(prevMembers);
          expect(await federation.getMembersByRevision.call(i + 1)).to.be.equalTo(newMembers);

          for (let j = 0; j < prevMembers.length; ++j) {
            expect(await federation.isMemberByRevision.call(i, prevMembers[j])).to.be.true();
          }

          for (let j = 0; j < newMembers.length; ++j) {
            expect(await federation.isMemberByRevision.call(i + 1, newMembers[j])).to.be.true();
          }

          expect(await federation.getConsensusThresholdByRevision.call(i)).to.be.bignumber.equal(prevThreshold);
          expect(await federation.getConsensusThresholdByRevision.call(i + 1)).to.be.bignumber.equal(newThreshold);

          prevMembers = newMembers;
        }
      });

      it('should update revision and history after removal', async () => {
        const members = TEST_ACCOUNTS_ADDRESSES.slice(4, 25);
        const federation = await Federation.new(members, { from: owner });
        expect(await federation.getFederationRevision.call()).to.be.bignumber.equal(0);
        expect(await federation.getMembersByRevision.call(0)).to.be.equalTo(members);
        for (let i = 0; i < members.length; ++i) {
          expect(await federation.isMemberByRevision.call(0, members[i])).to.be.true();
        }

        const threshold = Math.ceil(members.length * 2 / 3);
        expect(await federation.getConsensusThreshold.call()).to.be.bignumber.equal(threshold);
        expect(await federation.getConsensusThresholdByRevision.call(0)).to.be.bignumber.equal(threshold);

        const membersIndicesToRemove = [0, 3, 4, 8];
        for (let i = 0; i < membersIndicesToRemove.length; ++i) {
          const index = membersIndicesToRemove[i];
          const existingMember = members[index];
          const prevMembers = members.slice(0);
          members.splice(index, 1);
          const prevThreshold = Math.ceil(prevMembers.length * 2 / 3);
          const newThreshold = Math.ceil(members.length * 2 / 3);

          await federation.removeMember(existingMember);

          expect(await federation.getMembers.call()).to.be.equalTo(members);
          expect(await federation.getFederationRevision.call()).to.be.bignumber.equal(i + 1);
          expect(await federation.getMembersByRevision.call(i)).to.be.equalTo(prevMembers);
          expect(await federation.getMembersByRevision.call(i + 1)).to.be.equalTo(members);

          for (let j = 0; j < prevMembers.length; ++j) {
            expect(await federation.isMemberByRevision.call(i, prevMembers[j])).to.be.true();
          }

          for (let j = 0; j < members.length; ++j) {
            expect(await federation.isMemberByRevision.call(i + 1, members[j])).to.be.true();
          }

          expect(await federation.getConsensusThresholdByRevision.call(i)).to.be.bignumber.equal(prevThreshold);
          expect(await federation.getConsensusThresholdByRevision.call(i + 1)).to.be.bignumber.equal(newThreshold);
        }
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

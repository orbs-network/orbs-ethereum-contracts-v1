import chai from 'chai';
import dirtyChai from 'dirty-chai';
import assertArrays from 'chai-arrays';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;

chai.use(assertArrays);
chai.use(dirtyChai);

const TEST_ACCOUNTS = require('./accounts.json').accounts;

const Federation = artifacts.require('./Federation.sol');

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

    it('should initialize federation members', async () => {
      const federation = await Federation.new(members);
      expect(await federation.getMembers()).to.be.equalTo(members);
    });
  });

  describe('management', async () => {
    const owner = accounts[0];

    describe('addMember', async () => {
      context('as an owner', async () => {
        it('should add a member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const newMember = accounts[1];
          await federation.addMember(newMember);
          expect(await federation.getMembers()).to.be.containing(newMember);

          const newMember2 = accounts[2];
          await federation.addMember(newMember2);
          expect(await federation.getMembers()).to.be.containing(newMember2);
        });

        it('should not allow to add a more than the maximum possible members', async () => {
          const members = TEST_ACCOUNTS.slice(0, MAX_FEDERATION_MEMBERS - 1);
          const federation = await Federation.new(members, { from: owner });

          const newMember = TEST_ACCOUNTS[MAX_FEDERATION_MEMBERS - 1];
          await federation.addMember(newMember);
          expect(await federation.getMembers()).to.be.containing(newMember);

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
        const notOwner = accounts[1];

        it('should not allow to add a member', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const newMember = accounts[2];
          await expectRevert(federation.addMember(newMember, { from: notOwner }));
        });
      });
    });

    describe('removeMember', async () => {
      context('owner', async () => {
        it('should remove a member', async () => {
          const members = [accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const existingMember = members[0];
          await federation.removeMember(existingMember);
          expect(await federation.getMembers()).not.to.be.containing(existingMember);

          const existingMember2 = members[4];
          await federation.removeMember(existingMember2);
          expect(await federation.getMembers()).not.to.be.containing(existingMember2);
        });

        it('should not allow to remove all the members', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          await federation.removeMember(members[0]);
          await federation.removeMember(members[1]);

          expect(await federation.getMembers()).to.equalTo([members[2]]);
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
          expect(await federation.getMembers()).not.to.be.containing(nonMember);
          await expectRevert(federation.removeMember(nonMember));
        });
      });

      context('not an owner', async () => {
        const notOwner = accounts[1];

        it('should not allow to remove a member, if requested by not an owner', async () => {
          const members = [accounts[7], accounts[8], accounts[9]];
          const federation = await Federation.new(members, { from: owner });

          const existingMember = members[2];
          await expectRevert(federation.removeMember(existingMember, { from: notOwner }));
        });
      });
    });
  });
});

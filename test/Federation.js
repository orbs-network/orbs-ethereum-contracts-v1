import chai from 'chai';
import dirtyChai from 'dirty-chai';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;
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

      for (let i = 0; i < members.length; ++i) {
        expect(await federation.members.call(i)).to.eql(members[i]);
      }
    });
  });
});

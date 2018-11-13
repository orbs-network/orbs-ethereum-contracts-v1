import chai from 'chai';
import dirtyChai from 'dirty-chai';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;
chai.use(dirtyChai);

const AutonomousSwapBridge = artifacts.require('./AutonomousSwapBridge.sol');
const Federation = artifacts.require('./Federation.sol');
const TokenMock = artifacts.require('./OrbsTokenMock.sol');

contract('AutonomousSwapBridge', (accounts) => {
  const VIRTUAL_CHAIN_ID = '0x6b696e';
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
      expect(await asb.token.call()).to.be.bignumber.equal(token.address);
      expect(await asb.federation.call()).to.be.bignumber.equal(federation.address);
    });

    it('should report version', async () => {
      const asb = await AutonomousSwapBridge.new(VIRTUAL_CHAIN_ID, ORBS_ASB_CONTRACT_NAME, token.address,
        federation.address, { from: owner });

      expect(await asb.VERSION.call()).to.be.bignumber.equal(VERSION);
    });
  });
});

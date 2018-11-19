import chai from 'chai';
import dirtyChai from 'dirty-chai';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;
chai.use(dirtyChai);

const AutonomousSwapProofVerifierWrapper = artifacts.require('./AutonomousSwapProofVerifierWrapper.sol');

contract('AutonomousSwapProofVerifier', (accounts) => {
  const VERSION = '0.1';

  it('should report version', async () => {
    const verifier = await AutonomousSwapProofVerifierWrapper.new();

    expect(await verifier.getVersion.call()).to.be.bignumber.equal(VERSION);
  });

  context('invalid proof', async () => {
    it.skip('should error on invalid source Orbs address', async () => {
    });

    it.skip('should error on invalid destination Ethereum address', async () => {
    });

    it.skip('should error on 0 token amount Ethereum address', async () => {
    });
  });

  context('valid proof', async () => {
  });
});

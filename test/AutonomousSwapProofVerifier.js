import chai from 'chai';
import dirtyChai from 'dirty-chai';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;
chai.use(dirtyChai);

const AutonomousSwapProofVerifierWrapper = artifacts.require('./AutonomousSwapProofVerifierWrapper.sol');

contract.only('AutonomousSwapProofVerifier', (accounts) => {
  const VERSION = '0.1';

  it('should report version', async () => {
    const verifier = await AutonomousSwapProofVerifierWrapper.new();

    expect(await verifier.getVersion.call()).to.be.bignumber.equal(VERSION);
  });
});

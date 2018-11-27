import chai from 'chai';
import dirtyChai from 'dirty-chai';

const { expect } = chai;
chai.use(dirtyChai);

const AutonomousSwapProofVerifier = artifacts.require('../contracts/AutonomousSwapProofVerifier.sol');

contract('AutonomousSwapProofVerifier', () => {
  const VERSION = '0.1';

  let verifier;

  beforeEach(async () => {
    verifier = await AutonomousSwapProofVerifier.new();
  });

  it('should report version', async () => {
    expect(await verifier.VERSION.call()).to.be.bignumber.equal(VERSION);
  });

  describe('proof validation', async () => {
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
});

import chai from 'chai';
import dirtyChai from 'dirty-chai';
import utils from 'ethereumjs-util';
import expectRevert from './helpers/expectRevert';

const { expect } = chai;
chai.use(dirtyChai);

const AutonomousSwapProofVerifierWrapper = artifacts.require('./AutonomousSwapProofVerifierWrapper.sol');

contract.only('AutonomousSwapProofVerifier', (accounts) => {
  const VERSION = '0.1';
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  let verifier;

  beforeEach(async () => {
    verifier = await AutonomousSwapProofVerifierWrapper.new();
  });

  it('should report version', async () => {
    expect(await verifier.getVersion.call()).to.be.bignumber.equal(VERSION);
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

  describe.only('ECDSA signature validation', async () => {
    const signer = '0xf5486570e389004a726081366396827f56ea5bf1';
    const secretKey = Buffer.from('264306acaa51ab181dd52e9c8822121e4569bbfe4df5937e170aff25d02acb0d', 'hex');

    const signatures = [
      'Hello World!',
      'Hello World 2!',
      'Hello World 3!',
    ].map((message) => {
      const messageHashBuffer = utils.keccak256(message);
      const rawSignature = utils.ecsign(messageHashBuffer, secretKey);
      const signature = utils.toRpcSig(rawSignature.v, rawSignature.r, rawSignature.s);

      return {
        messageHash: `0x${messageHashBuffer.toString('hex')}`,
        signature,
      };
    });

    it('should verify correct signatures', async () => {
      for (let i = 0; i < signatures.length; ++i) {
        const signature = signatures[i];
        expect(await verifier.isECDSASignatureValid.call(signature.messageHash, signature.signature, signer)).to.be.true();
      }
    });

    it('should detect incorrect signatures', async () => {
      const correctSignature = signatures[0].signature;
      const correctHash = signatures[0].messageHash;

      const wrongSigner = accounts[5];
      const wrongHash = `0x${utils.keccak256('Goodbye World!').toString('hex')}`;
      const wrongSignature = signatures[1].signature;

      expect(await verifier.isECDSASignatureValid.call(correctHash, correctSignature, wrongSigner)).to.be.false();
      expect(await verifier.isECDSASignatureValid.call(wrongHash, correctSignature, signer)).to.be.false();
      expect(await verifier.isECDSASignatureValid.call(correctHash, wrongSignature, signer)).to.be.false();
    });

    it('should return false on a 0x0 address', async () => {
      const signature = signatures[0];
      expect(await verifier.isECDSASignatureValid.call(signature.messageHash, signature.signature, ZERO_ADDRESS)).to.be.false();
    });

    it('should return false on a signature which is too short', async () => {
      const signature = signatures[0];
      expect(await verifier.isECDSASignatureValid.call(signature.messageHash, signature.signature.slice(0,
        signature.signature.length - 1), signer)).to.be.false();
    });

    it('should return false on a signature which is too long', async () => {
      const signature = signatures[0];
      expect(await verifier.isECDSASignatureValid.call(signature.messageHash, `${signature.signature}ab`,
        signer)).to.be.false();
    });
  });
});

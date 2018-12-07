import chai from 'chai';

import utils from 'ethereumjs-util';

import { ASBProof } from './helpers/asbProof';

const TEST_ACCOUNTS = require('./accounts.json');

const { expect } = chai;

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

  describe('parsing', async () => {
    describe('results block header', async () => {
      it('should properly parse', async () => {
        const data = {
          protocolVersion: 2,
          virtualChainId: 1111,
          networkType: 1,
          timestamp: 1544081404,
          receiptMerkleRoot: utils.keccak256('Hello World!!!'),
        };

        const resultsBlockHeader = ASBProof.buildResultsBlockHeader(data);
        const rawResultsBlockHeader = utils.bufferToHex(resultsBlockHeader);
        const resultsBlockHeaderData = await verifier.parseResultsBlockHeader.call(rawResultsBlockHeader);

        expect(resultsBlockHeaderData[0]).to.be.bignumber.equal(data.protocolVersion);
        expect(resultsBlockHeaderData[1]).to.be.bignumber.equal(data.virtualChainId);
        expect(resultsBlockHeaderData[2]).to.be.bignumber.equal(data.networkType);
        expect(resultsBlockHeaderData[3]).to.be.bignumber.equal(data.timestamp);
        expect(utils.toBuffer(resultsBlockHeaderData[4])).to.eql(data.receiptMerkleRoot);
      });
    });

    describe('results block proof', async () => {
      it('should properly parse', async () => {
        const testSignatures = TEST_ACCOUNTS.slice(0, 32).map((account) => {
          const messageHashBuffer = utils.keccak256('Hello world3!');
          const rawSignature = utils.ecsign(messageHashBuffer, utils.toBuffer(account.privateKey));
          const signature = utils.toRpcSig(rawSignature.v, rawSignature.r, rawSignature.s);

          return {
            publicAddress: account.address,
            signature,
          };
        });

        const blockHash = utils.keccak256('Hello World2!');
        const data = {
          blockProofVersion: 5,
          transactionsBlockHash: utils.keccak256('Hello World!'),
          blockrefMessage: Buffer.concat([Buffer.alloc(20), blockHash]),
          signatures: testSignatures,
        };

        const resultsBlockProof = ASBProof.buildResultsProof(data);
        const rawResultsBlockProof = utils.bufferToHex(resultsBlockProof);
        const resultsBlockProofData = await verifier.parseResultsBlockProof.call(rawResultsBlockProof);

        expect(resultsBlockProofData[0]).to.be.bignumber.equal(data.blockProofVersion);
        expect(utils.toBuffer(resultsBlockProofData[1])).to.eql(data.transactionsBlockHash);
        expect(utils.toBuffer(resultsBlockProofData[2])).to.eql(utils.keccak256(data.blockrefMessage));
        expect(utils.toBuffer(resultsBlockProofData[3])).to.eql(blockHash);
        const numOfSignatures = resultsBlockProofData[4].toNumber();
        expect(numOfSignatures).to.be.bignumber.equal(data.signatures.length);

        for (let i = 0; i < numOfSignatures; ++i) {
          expect(resultsBlockProofData[5][i]).to.be.eql(testSignatures[i].publicAddress);

          // TODO: at the moment, truffle can't properly parse the returned bytes[MAX_SIGNATURE] addresses. This should
          // be fixed in truffle 0.5 and later.
          // expect(resultsBlockProofData[6][i]).to.be.eql(testSignatures[i].signature);
        }
      });
    });

    describe('event data', async () => {
      it('should properly parse', async () => {
        const data = {
          orbsContractName: 'Hello World!',
          eventId: 12,
          tuid: 56789,
          orbsAddress: Buffer.from('ef0ee8a2ba59624e227f6ac0a85e6aa5e75df86a', 'hex'),
          ethereumAddress: '0x2c80c37bdf6d68390ccaa03a125f65dcc43b7a5f',
          value: 1500,
        };

        const event = ASBProof.buildEventData(data);
        const rawEventData = utils.bufferToHex(event);
        const eventData = await verifier.parseEventData.call(rawEventData);

        expect(eventData[0]).to.eql(data.orbsContractName);
        expect(eventData[1]).to.be.bignumber.equal(data.eventId);
        expect(eventData[2]).to.be.bignumber.equal(data.tuid);
        expect(eventData[3]).to.eql(utils.bufferToHex(data.orbsAddress));
        expect(eventData[4]).to.eql(data.ethereumAddress);
        expect(eventData[5]).to.be.bignumber.equal(data.value);
      });
    });
  });
});

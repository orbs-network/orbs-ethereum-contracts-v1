import chai from 'chai';
import utils from 'ethereumjs-util';

import expectRevert from './helpers/expectRevert';
import ASBProof from './helpers/asbProof';

const TEST_ACCOUNTS = require('./accounts.json');

const { expect } = chai;

const Federation = artifacts.require('./Federation.sol');
const AutonomousSwapProofVerifierWrapper = artifacts.require('./AutonomousSwapProofVerifierWrapper.sol');

contract('AutonomousSwapProofVerifier', (accounts) => {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const VERSION = 1;

  const owner = accounts[0];

  it('should not allow to create with a 0x0 federation', async () => {
    await expectRevert(AutonomousSwapProofVerifierWrapper.new(ZERO_ADDRESS, { from: owner }));
  });

  it('should report version', async () => {
    const federation = await Federation.new(accounts.slice(0, 2), { from: owner });
    const verifier = await AutonomousSwapProofVerifierWrapper.new(federation.address, { from: owner });
    expect(await verifier.VERSION.call()).to.be.bignumber.equal(VERSION);
  });

  describe('parsing', async () => {
    let verifier;

    beforeEach(async () => {
      const federation = await Federation.new(accounts.slice(0, 2), { from: owner });
      verifier = await AutonomousSwapProofVerifierWrapper.new(federation.address, { from: owner });
    });

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
        const resultsBlockHeaderData = await verifier.parseResultsBlockHeaderRaw.call(rawResultsBlockHeader);

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
        const resultsBlockProofData = await verifier.parseResultsBlockProofRaw.call(rawResultsBlockProof);

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

    describe('transaction receipt', async () => {
      it('should properly parse', async () => {
        const eventData = {
          orbsContractName: 'Hello World!',
          eventId: 12,
          tuid: 56789,
          orbsAddress: Buffer.from('ef0ee8a2ba59624e227f6ac0a85e6aa5e75df86a', 'hex'),
          ethereumAddress: accounts[8],
          value: 1500,
        };

        const data = {
          executionResult: 5,
        };

        const transactionReceipt = ASBProof.buildTransactionReceipt(data, eventData);
        const rawTransactionReceipt = utils.bufferToHex(transactionReceipt);
        const transactionReceiptfData = await verifier.parseTransactionReceiptRaw.call(rawTransactionReceipt);

        expect(transactionReceiptfData[0]).to.be.bignumber.equal(data.executionResult);
        expect(utils.toBuffer(transactionReceiptfData[1])).to.eql(ASBProof.buildEventData(eventData));
      });
    });

    describe('event data', async () => {
      it('should properly parse', async () => {
        const data = {
          orbsContractName: 'Hello World!',
          eventId: 12,
          tuid: 56789,
          orbsAddress: Buffer.from('ef0ee8a2ba59624e227f6ac0a85e6aa5e75df86a', 'hex'),
          ethereumAddress: accounts[3],
          value: 1500,
        };

        const event = ASBProof.buildEventData(data);
        const rawEventData = utils.bufferToHex(event);
        const eventData = await verifier.parseEventDataRaw.call(rawEventData);

        expect(eventData[0]).to.eql(data.orbsContractName);
        expect(eventData[1]).to.be.bignumber.equal(data.eventId);
        expect(eventData[2]).to.be.bignumber.equal(data.tuid);
        expect(eventData[3]).to.eql(utils.bufferToHex(data.orbsAddress));
        expect(eventData[4]).to.eql(data.ethereumAddress);
        expect(eventData[5]).to.be.bignumber.equal(data.value);
      });
    });
  });

  describe('proof processing', async () => {
    const NETWORK_TYPE = 0;
    const VIRTUAL_CHAIN_ID = 0x6b696e;
    const ORBS_ASB_CONTRACT_NAME = 'asb';
    const PROTOCOL_VERSION = 2;
    const ORBS_ADDRESS = 'ef0ee8a2ba59624e227f6ac0a85e6aa5e75df86a';

    let federation;
    let verifier;

    beforeEach(async () => {
      const federationMemberAccounts = TEST_ACCOUNTS.slice(0, 32);
      const federationMembersAddresses = federationMemberAccounts.map(account => account.address);
      federation = await Federation.new(federationMembersAddresses, { from: owner });
      verifier = await AutonomousSwapProofVerifierWrapper.new(federation.address, { from: owner });
    });

    const getProofData = async (proof) => {
      const rawProof = proof.getHexProof();
      const proofData = await verifier.processProofRaw.call(rawProof.resultsBlockHeader, rawProof.resultsBlockProof,
        rawProof.transactionReceipt, rawProof.transactionReceiptProof);

      return {
        networkType: proofData[0],
        virtualChainId: proofData[1],
        orbsAddress: proofData[2],
        ethereumAddress: proofData[3],
        value: proofData[4],
        tuid: proofData[5],
      };
    };

    context('valid', async () => {
      it('should process correctly', async () => {
        const proof = (new ASBProof())
          .setFederationMemberAccounts(federationMemberAccounts)
          .setOrbsContractName(ORBS_ASB_CONTRACT_NAME)
          .setEventId(7755)
          .setTuid(12)
          .setOrbsAddress(ORBS_ADDRESS)
          .setEthereumAddress(accounts[5])
          .setValue(100000)
          .setTransactionExecutionResult(1)
          .setTransactionReceipts(['transaction1', 'transaction2', 5, 4, 3])
          .setProtocolVersion(PROTOCOL_VERSION)
          .setVirtualChainId(VIRTUAL_CHAIN_ID)
          .setNetworkType(NETWORK_TYPE)
          .setTimestamp(Math.floor((new Date()).getTime() / 1000))
          .setBlockProofVersion(0);

        const proofData = await getProofData(proof);
        expect(proofData.networkType).to.be.bignumber.equal(proof.networkType);
        expect(proofData.virtualChainId).to.be.bignumber.equal(proof.virtualChainId);
        expect(proofData.orbsAddress).to.eql(utils.bufferToHex(proof.orbsAddress));
        expect(proofData.ethereumAddress).to.eql(proof.ethereumAddress);
        expect(proofData.value).to.be.bignumber.equal(proof.value);
        expect(proofData.tuid).to.be.bignumber.equal(proof.tuid);
      });
    });

    context('invalid', async () => {
      let proof;
      beforeEach(async () => {
        proof = (new ASBProof())
          .setFederationMemberAccounts(federationMemberAccounts)
          .setOrbsContractName(ORBS_ASB_CONTRACT_NAME)
          .setEventId(7755)
          .setTuid(12)
          .setOrbsAddress(ORBS_ADDRESS)
          .setEthereumAddress(accounts[5])
          .setValue(100000)
          .setTransactionExecutionResult(1)
          .setTransactionReceipts(['transaction1', 'transaction2', 5, 4, 3])
          .setProtocolVersion(PROTOCOL_VERSION)
          .setVirtualChainId(VIRTUAL_CHAIN_ID)
          .setNetworkType(NETWORK_TYPE)
          .setTimestamp(Math.floor((new Date()).getTime() / 1000))
          .setBlockProofVersion(0);
      });

      afterEach(async () => {
        await expectRevert(getProofData(proof));
      });

      context('Orbs address', async () => {
        context('is too long', async () => {
          it('should revert', async () => {
            proof.setOrbsAddress(`${ORBS_ADDRESS}aa`);
          });
        });

        context('is too short', async () => {
          it('should revert', async () => {
            proof.setOrbsAddress(ORBS_ADDRESS.slice(0, -2));
          });
        });
      });

      context('Ethereum address', async () => {
        context('is too long', async () => {
          it('should revert', async () => {
            proof.setEthereumAddress(`${accounts[1]}1234`);
          });
        });

        context('is too short', async () => {
          it('should revert', async () => {
            proof.setEthereumAddress(accounts[1].slice(0, -4));
          });
        });
      });

      context('execution result', async () => {
        context('is 0', async () => {
          it('should revert', async () => {
            proof.setTransactionExecutionResult(0);
          });
        });
      });

      context('protocol version', async () => {
        context('is incorrect', async () => {
          it('should revert', async () => {
            proof.setProtocolVersion(PROTOCOL_VERSION + 10);
          });
        });
      });

      context('block hash', async () => {
        context('is incorrect', async () => {
          it('should revert', async () => {
            proof.setBlockHash(utils.keccak256('Wrong block!!!'));
          });
        });
      });
    });
  });
});

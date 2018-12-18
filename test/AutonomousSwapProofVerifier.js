import chai from 'chai';
import utils from 'ethereumjs-util';

import expectRevert from './helpers/expectRevert';
import ASBProof from './helpers/asbProof';
import MerkleTree from './helpers/merkleTree';

const TEST_ACCOUNTS = require('./accounts.json');

const { expect } = chai;

const Federation = artifacts.require('./Federation.sol');
const AutonomousSwapProofVerifierWrapper = artifacts.require('./AutonomousSwapProofVerifierWrapper.sol');

contract('AutonomousSwapProofVerifier', (accounts) => {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const VERSION = 1;
  const MAX_SIGNATURES = 100;

  const owner = accounts[0];

  describe('construction', async () => {
    it('should not allow to create with a 0x0 federation', async () => {
      await expectRevert(AutonomousSwapProofVerifierWrapper.new(ZERO_ADDRESS, { from: owner }));
    });

    it('should report version', async () => {
      const federation = await Federation.new(accounts.slice(0, 2), { from: owner });
      const verifier = await AutonomousSwapProofVerifierWrapper.new(federation.address, { from: owner });
      expect(await verifier.VERSION.call()).to.be.bignumber.equal(VERSION);
    });
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
          receiptMerkleRoot: utils.sha256('Hello World!!!'),
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
        const testSignatures = TEST_ACCOUNTS.slice(0, MAX_SIGNATURES).map((account) => {
          const messageHashBuffer = utils.sha256('Hello world3!');
          const rawSignature = utils.ecsign(messageHashBuffer, utils.toBuffer(account.privateKey));
          const signature = utils.toRpcSig(rawSignature.v, rawSignature.r, rawSignature.s);

          return {
            publicAddress: account.address,
            signature,
          };
        });

        const block_ref_data = {
          helixMessageType:3,
          blockHash: utils.sha256('Hello World2!'),     
        }
          
        const data = {
          blockProofVersion: 5,
          transactionsBlockHash: utils.sha256('Hello World!'),
          blockrefMessage: ASBProof.buildblockRef(block_ref_data),
          signatures: testSignatures,
        };

        const resultsBlockProof = ASBProof.buildResultsProof(data);
        const rawResultsBlockProof = utils.bufferToHex(resultsBlockProof);
        const resultsBlockProofData = await verifier.parseResultsBlockProofRaw.call(rawResultsBlockProof);

        //expect(resultsBlockProofData[0]).to.be.bignumber.equal(data.blockProofVersion); TODO
        expect(utils.toBuffer(resultsBlockProofData[1])).to.eql(data.transactionsBlockHash);
        expect(utils.toBuffer(resultsBlockProofData[2])).to.eql(utils.sha256(data.blockrefMessage));
        expect(resultsBlockProofData[3]).to.be.bignumber.equal(block_ref_data.helixMessageType);
        expect(utils.toBuffer(resultsBlockProofData[4])).to.eql(block_ref_data.blockHash);
        const numOfSignatures = resultsBlockProofData[5].toNumber();
        expect(numOfSignatures).to.be.bignumber.equal(data.signatures.length);

        for (let i = 0; i < numOfSignatures; ++i) {
          expect(resultsBlockProofData[6][i]).to.be.eql(testSignatures[i].publicAddress);

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
          eventName: "TransferedOut",
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
          eventName: "TransferedOut",
          tuid: 56789,
          orbsAddress: Buffer.from('ef0ee8a2ba59624e227f6ac0a85e6aa5e75df86a', 'hex'),
          ethereumAddress: accounts[3],
          value: 1500,
        };

        const event = ASBProof.buildEventData(data);
        const rawEventData = utils.bufferToHex(event);
        const eventData = await verifier.parseEventDataRaw.call(rawEventData);

        expect(eventData[0]).to.eql(data.orbsContractName);
        expect(eventData[1]).to.eql(data.eventName);
        expect(eventData[2]).to.be.bignumber.equal(data.tuid);
        expect(eventData[3]).to.eql(utils.bufferToHex(data.orbsAddress));
        expect(eventData[4]).to.eql(data.ethereumAddress);
        expect(eventData[5]).to.be.bignumber.equal(data.value);
      });
    });

    // describe('packed proof', async () => {
    //   it('should properly parse', async () => {
    //     // resultsBlockHeader
    //     const results_block_header_data = {
    //       protocolVersion: 2,
    //       virtualChainId: 1111,
    //       networkType: 1,
    //       timestamp: 1544081404,
    //       receiptMerkleRoot: utils.sha256('Hello World!!!'),
    //     };

    //     const resultsBlockHeader = ASBProof.buildResultsBlockHeader(results_block_header_data);
    //     const rawResultsBlockHeader = utils.bufferToHex(resultsBlockHeader);

    //     // resultsBlockProof
    //     const testSignatures = TEST_ACCOUNTS.slice(0, MAX_SIGNATURES).map((account) => {
    //       const messageHashBuffer = utils.sha256('Hello world3!');
    //       const rawSignature = utils.ecsign(messageHashBuffer, utils.toBuffer(account.privateKey));
    //       const signature = utils.toRpcSig(rawSignature.v, rawSignature.r, rawSignature.s);

    //       return {
    //         publicAddress: account.address,
    //         signature,
    //       };
    //     });

    //     const block_ref_data = {
    //       helixMessageType: 3,
    //       blockHash: utils.sha256('Hello World2!'),     
    //     }
        
    //     const data = {
    //       blockProofVersion: 5,
    //       transactionsBlockHash: utils.sha256('Hello World!'),
    //       blockrefMessage: ASBProof.buildblockRef(block_ref_data),
    //       signatures: testSignatures,
    //     };

    //     const resultsBlockProof = ASBProof.buildResultsProof(data);
    //     const rawResultsBlockProof = utils.bufferToHex(resultsBlockProof);
    
    //     // receiptMerkleProof
    //   });
    // });
  });

  describe('proof processing', async () => {
    const NETWORK_TYPE = 0;
    const VIRTUAL_CHAIN_ID = 0x6b696e;
    const ORBS_ASB_CONTRACT_NAME = 'asb';
    const TRANSFERED_OUT_EVENT_NAME = 'TransferedOut';
    const PROTOCOL_VERSION = 2;
    const ORBS_ADDRESS = 'ef0ee8a2ba59624e227f6ac0a85e6aa5e75df86a';
    const TRANSFERED_OUT_EVENT_ID = 1;

    const tuid = 12;

    let federationMemberAccounts;
    let federationMembersAddresses;
    let federation;
    let verifier;

    beforeEach(async () => {
      federationMemberAccounts = TEST_ACCOUNTS.slice(0, MAX_SIGNATURES);
      federationMembersAddresses = federationMemberAccounts.map(account => account.address);
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
        orbsContractName: proofData[2],
        orbsAddress: proofData[3],
        ethereumAddress: proofData[4],
        value: proofData[5],
        tuid: proofData[6],
      };
    };

    const getWithNonMembers = (count) => {
      const nonMemberAccounts = TEST_ACCOUNTS.slice(-count);
      expect(federationMemberAccounts).not.to.be.containingAnyOf(nonMemberAccounts);
      federationMemberAccounts.splice(0, nonMemberAccounts.length, ...nonMemberAccounts);
      return federationMemberAccounts;
    };

    const getWithWrongPrivateKeys = (count) => {
      const nonMemberAccounts = TEST_ACCOUNTS.slice(-count);
      expect(federationMemberAccounts).not.to.be.containingAnyOf(nonMemberAccounts);

      for (let i = 0; i < count; ++i) {
        federationMemberAccounts[i].privateKey = nonMemberAccounts[i].privateKey;
      }

      return federationMemberAccounts;
    };

    const getWithDuplicates = (count) => {
      const duplicate = federationMemberAccounts[0];

      for (let i = 0; i < count; ++i) {
        federationMemberAccounts[i] = duplicate;
      }

      return federationMemberAccounts;
    };

    let proof;
    beforeEach(async () => {
      proof = (new ASBProof())
        .setFederationMemberAccounts(federationMemberAccounts)
        .setOrbsContractName(ORBS_ASB_CONTRACT_NAME)
        .setEventName(TRANSFERED_OUT_EVENT_NAME)
        .setTuid(tuid)
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

    context('valid', async () => {
      afterEach(async () => {
        const proofData = await getProofData(proof);
        expect(proofData.networkType).to.be.bignumber.equal(proof.networkType);
        expect(proofData.virtualChainId).to.be.bignumber.equal(proof.virtualChainId);
        expect(proofData.orbsContractName).to.be.eql(proof.orbsContractName);
        expect(proofData.orbsAddress).to.eql(utils.bufferToHex(proof.orbsAddress));
        expect(proofData.ethereumAddress).to.eql(proof.ethereumAddress);
        expect(proofData.value).to.be.bignumber.equal(proof.value);
        expect(proofData.tuid).to.be.bignumber.equal(proof.tuid);
      });

      it('should process correctly historic events', async () => {
        federationMemberAccounts = TEST_ACCOUNTS.slice(0, 20);
        const newFederationMemberAccounts = TEST_ACCOUNTS.slice(40, 45);
        federationMembersAddresses = federationMemberAccounts.map(account => account.address);
        federation = await Federation.new(federationMembersAddresses, { from: owner });
        verifier = await AutonomousSwapProofVerifierWrapper.new(federation.address, { from: owner });

        const proofs = [];
        for (let i = 0; i < 5; ++i) {
          proofs.push((new ASBProof())
            .setFederationMemberAccounts(federationMemberAccounts.slice(0))
            .setOrbsContractName(ORBS_ASB_CONTRACT_NAME)
            .setEventName(TRANSFERED_OUT_EVENT_NAME)
            .setTuid(tuid)
            .setOrbsAddress(ORBS_ADDRESS)
            .setEthereumAddress(accounts[5])
            .setValue(100000)
            .setTransactionExecutionResult(1)
            .setTransactionReceipts(['transaction1', 'transaction2', 5, 4, 3])
            .setProtocolVersion(PROTOCOL_VERSION)
            .setVirtualChainId(VIRTUAL_CHAIN_ID)
            .setNetworkType(NETWORK_TYPE)
            .setTimestamp(Math.floor((new Date()).getTime() / 1000))
            .setBlockProofVersion(i));

          const newMemberAccount = newFederationMemberAccounts[i];
          await federation.addMember(newMemberAccount.address, { from: owner });
          expect(await federation.getFederationRevision.call()).to.be.bignumber.equal(i + 1);

          federationMemberAccounts.push(newMemberAccount);
        }

        for (let i = 0; i < proofs.length; ++i) {
          const currentProof = proofs[i];
          const proofData = await getProofData(proof);
          expect(proofData.networkType).to.be.bignumber.equal(currentProof.networkType);
          expect(proofData.virtualChainId).to.be.bignumber.equal(currentProof.virtualChainId);
          expect(proofData.orbsContractName).to.be.eql(currentProof.orbsContractName);
          expect(proofData.orbsAddress).to.eql(utils.bufferToHex(currentProof.orbsAddress));
          expect(proofData.ethereumAddress).to.eql(currentProof.ethereumAddress);
          expect(proofData.value).to.be.bignumber.equal(currentProof.value);
          expect(proofData.tuid).to.be.bignumber.equal(currentProof.tuid);
        }
      });

      context('federation members signatures', async () => {
        context('reaching threshold regardless of', async () => {
          context('few non-member public addresses signatures', async () => {
            it('should process correctly', async () => {
              proof.setFederationMemberAccounts(getWithNonMembers(3));
            });
          });

          context('few wrong private keys', async () => {
            it('should process correctly', async () => {
              proof.setFederationMemberAccounts(getWithWrongPrivateKeys(5));
            });
          });

          context('few duplicate signatures', async () => {
            it('should process correctly', async () => {
              proof.setFederationMemberAccounts(getWithDuplicates(2));
            });
          });
        });
      });
    });

    context('invalid', async () => {
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

      context('event name is not TransferedOut', async () => {
        context('is incorrect', async () => {
          it('should revert', async () => {
            proof.setEventName("other_name");
          });
        });
      });

      context('value', async () => {
        context('is of wrong size', async () => {
          it('should revert', async () => {
            proof.setEventOptions({ wrongValueSize: 12345 });
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

      context('transactions block hash', async () => {
        context('is of wrong size', async () => {
          it('should revert', async () => {
            proof.setWrongtTansactionsBlockHash(Buffer.alloc(10));
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
            proof.setWrongBlockHash(utils.sha256('Wrong block!!!'));
          });
        });
      });

      context('federation members signatures', async () => {
        context('public address', async () => {
          context('is of incorrect size', async () => {
            it('should revert', async () => {
              proof.setResultsProofOptions({ wrongPublicAddressSize: 10 });
            });
          });
        });

        context('signature', async () => {
          context('is of incorrect size', async () => {
            it('should revert', async () => {
              proof.setResultsProofOptions({ wrongSignatureSize: 100 });
            });
          });
        });

        context('not reaching threshold due to', async () => {
          context('too many non-member public addresses', async () => {
            it('should revert', async () => {
              proof.setFederationMemberAccounts(getWithNonMembers(federationMemberAccounts.length / 2));
            });
          });

          context('too many wrong private keys', async () => {
            it('should revert', async () => {
              proof.setFederationMemberAccounts(getWithWrongPrivateKeys(federationMemberAccounts.length / 2));
            });
          });

          context('too many incorrect message signatures', async () => {
            it('should revert', async () => {
              proof.setWrongBlockRefHash(utils.sha256('Wrong block!!!'));
            });
          });

          context('too many signatures', async () => {
            it('should revert', async () => {
              proof.setFederationMemberAccounts(TEST_ACCOUNTS.slice(0, MAX_SIGNATURES + 10));
            });
          });

          context('too many duplicate signatures', async () => {
            it('should revert', async () => {
              proof.setFederationMemberAccounts(getWithDuplicates(federationMemberAccounts.length / 2));
            });
          });
        });
      });

      context('receipt merkle proof', async () => {
        context('incorrect root', async () => {
          it('should revert', async () => {
            proof.setWrongTransactionReceiptProofRoot(utils.sha256('Wrong root!!!'));
          });
        });

        context('incorrect proof', async () => {
          it('should revert', async () => {
            const merkle = new MerkleTree([1, 2, 3]);
            proof.setWrongTransactionReceiptProof(merkle.getProof(2));
          });
        });
      });
    });
  });
});

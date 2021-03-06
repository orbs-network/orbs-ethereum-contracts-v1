/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import utils from 'ethereumjs-util';

import Bytes from './bytes';
import MerkleTree from './merkleTree';

const UINT16_SIZE = 2;
const UINT32_SIZE = 4;
const UINT64_SIZE = 8;
const UINT256_SIZE = 32;
const SHA256_SIZE = 32;

const DUMMY_BLOCK_HASH = utils.sha256('Dummy Block Hash');

class ASBProof {
  getProof() {
    this.verifyData();

    // Create the transaction receipts merkle tree.
    const transactionReceipt = ASBProof.buildTransactionReceipt({
      executionResult: this.executionResult,
    }, {
      orbsContractName: this.orbsContractName,
      eventName: this.eventName,
      tuid: this.tuid,
      orbsAddress: this.orbsAddress,
      ethereumAddress: this.ethereumAddress,
      value: this.value,
    }, this.eventOptions);

    // Create the transaction receipt merkle proof.
    const transactionReceipts = this.transactionReceipts ? [...this.transactionReceipts, transactionReceipt]
      : [transactionReceipt];
    const transactionsMerkleTree = new MerkleTree(transactionReceipts);
    const transactionReceiptProofRoot = this.transactionReceiptProofRoot || transactionsMerkleTree.getRoot();

    // Create the results block header data.
    const resultsBlockHeader = ASBProof.buildResultsBlockHeader({
      protocolVersion: this.protocolVersion,
      virtualChainId: this.virtualChainId,
      networkType: this.networkType,
      timestamp: this.timestamp,
      receiptMerkleRoot: transactionReceiptProofRoot,
    });

    // Create the results block proof.
    const resultsBlockHeaderHash = utils.sha256(resultsBlockHeader);
    const transactionsBlockHash = this.transactionsBlockHash || DUMMY_BLOCK_HASH; // Just a dummy value.
    const blockHash = this.blockHash || utils.sha256(Buffer.concat([transactionsBlockHash, resultsBlockHeaderHash]));
    const block_ref_data = {
      helixMessageType: 3,
      blockHash: blockHash,
    }
    
    const blockrefMessage = ASBProof.buildblockRef(block_ref_data);
    const blockrefHash = this.blockrefHash || utils.sha256(blockrefMessage);

    const signatures = this.federationMemberAccounts.map((account) => {
      const rawSignature = utils.ecsign(blockrefHash, utils.toBuffer(account.privateKey));
      const signature = utils.toRpcSig(rawSignature.v, rawSignature.r, rawSignature.s);

      return {
        publicAddress: account.address,
        signature,
      };
    });
    
    const resultsBlockProof = ASBProof.buildResultsProof({
      blockProofVersion: this.blockProofVersion,
      transactionsBlockHash: transactionsBlockHash,
      blockrefMessage: blockrefMessage,
      signatures: signatures,
    }, this.resultsProofOptions);
    
    return {
      resultsBlockHeader,
      resultsBlockProof,
      transactionReceipt,
      transactionReceiptProof: this.transactionReceiptProof || transactionsMerkleTree.getProof(transactionReceipt),
    };
  }

  getHexProof() {
    const proof = this.getProof();
    return {
      resultsBlockHeader: utils.bufferToHex(proof.resultsBlockHeader),
      resultsBlockProof: utils.bufferToHex(proof.resultsBlockProof),
      transactionReceipt: utils.bufferToHex(proof.transactionReceipt),
      transactionReceiptProof: MerkleTree.bufArrToHexArr(proof.transactionReceiptProof),
    };
  }

  getPackedProof() {
    const proof = this.getProof();
    let packedMerkle = proof.transactionReceiptProof[0];
    for (let i = 1; i < 3; i++) { 
      packedMerkle = Buffer.concat([packedMerkle, proof.transactionReceiptProof[i]]);
    }
    return {
      packedProof: utils.bufferToHex(Buffer.concat([
        Bytes.numberToBuffer(proof.resultsBlockHeader.length, UINT32_SIZE),
        Bytes.padToDword(proof.resultsBlockHeader),
        Bytes.numberToBuffer(proof.resultsBlockProof.length, UINT32_SIZE),
        Bytes.padToDword(proof.resultsBlockProof),
        Bytes.numberToBuffer(packedMerkle.length, UINT32_SIZE),
        packedMerkle,
        ])),
      transactionReceipt: utils.bufferToHex(proof.transactionReceipt),
    }
  }

  setFederationMemberAccounts(federationMemberAccounts) {
    this.federationMemberAccounts = federationMemberAccounts;
    return this;
  }

  setOrbsContractName(orbsContractName) {
    this.orbsContractName = orbsContractName;
    return this;
  }

  setEventName(eventName) {
    this.eventName = eventName;
    return this;
  }

  setTuid(tuid) {
    this.tuid = tuid;
    return this;
  }

  setOrbsAddress(orbsAddress) {
    this.orbsAddress = Buffer.from(orbsAddress, 'hex');
    return this;
  }

  setEthereumAddress(ethereumAddress) {
    this.ethereumAddress = ethereumAddress;
    return this;
  }

  setValue(value) {
    this.value = value;
    return this;
  }

  setTransactionExecutionResult(executionResult) {
    this.executionResult = executionResult;
    return this;
  }

  setTransactionReceipts(transactionReceipts) {
    this.transactionReceipts = transactionReceipts;
    return this;
  }

  setProtocolVersion(protocolVersion) {
    this.protocolVersion = protocolVersion;
    return this;
  }

  setVirtualChainId(virtualChainId) {
    this.virtualChainId = virtualChainId;
    return this;
  }

  setNetworkType(networkType) {
    this.networkType = networkType;
    return this;
  }

  setTimestamp(timestamp) {
    this.timestamp = timestamp;
    return this;
  }

  setBlockProofVersion(blockProofVersion) {
    this.blockProofVersion = blockProofVersion;
    return this;
  }

  // The following are used for testing failures:

  setWrongBlockHash(blockHash) {
    this.blockHash = blockHash;
    return this;
  }

  setWrongBlockRefHash(blockrefHash) {
    this.blockrefHash = blockrefHash;
    return this;
  }

  setWrongTransactionReceiptProofRoot(transactionReceiptProofRoot) {
    this.transactionReceiptProofRoot = transactionReceiptProofRoot;
    return this;
  }

  setWrongTransactionReceiptProof(transactionReceiptProof) {
    this.transactionReceiptProof = transactionReceiptProof;
    return this;
  }

  setWrongtTansactionsBlockHash(transactionsBlockHash) {
    this.transactionsBlockHash = transactionsBlockHash;
    return this;
  }

  setEventOptions(eventOptions) {
    this.eventOptions = eventOptions;
    return this;
  }

  setResultsProofOptions(resultsProofOptions) {
    this.resultsProofOptions = resultsProofOptions;
    return this;
  }

  verifyData() {
    if (!Array.isArray(this.federationMemberAccounts) || this.federationMemberAccounts.length === 0) {
      throw new Error('Missing federation member accounts!');
    }

    if (!this.orbsContractName) {
      throw new Error('Missing Orbs contract name!');
    }

    if (!this.eventName) {
      throw new Error('Missing event name!');
    }

    if (!Number.isInteger(this.tuid)) {
      throw new Error('Missing tuid!');
    }

    if (!this.orbsAddress) {
      throw new Error('Missing Orbs address!');
    }

    if (!this.ethereumAddress) {
      throw new Error('Missing Ethereum address!');
    }

    if (!Number.isInteger(this.value)) {
      throw new Error('Missing value!');
    }

    if (!Number.isInteger(this.executionResult)) {
      throw new Error('Missing transaction execution result!');
    }

    if (!Number.isInteger(this.protocolVersion)) {
      throw new Error('Missing protocol version!');
    }

    if (!Number.isInteger(this.virtualChainId)) {
      throw new Error('Missing virtual chain ID!');
    }

    if (!Number.isInteger(this.networkType)) {
      throw new Error('Missing network type!');
    }

    if (!Number.isInteger(this.timestamp)) {
      throw new Error('Missing timestamp');
    }

    if (!Number.isInteger(this.blockProofVersion)) {
      throw new Error('Missing block proof version!');
    }
  }

  // Builds the Results Block Header according to:
  // +---------------------+--------+------+----------------------+
  // |        Field        | Offset | Size |       Encoding       |
  // +---------------------+--------+------+----------------------+
  // | protocol_version    |      0 |    4 | uint32               |
  // | virtual_chain_id    |      4 |    8 | uint64               |
  // | network_type        |     12 |    4 | enum (4 bytes)       |
  // | timestamp           |     16 |    8 | uint64 unix 64b time |
  // | receipt_merkle_root |     64 |   32 | bytes (32B)          |
  // +---------------------+--------+------+----------------------+
  static buildResultsBlockHeader(resultsBlockHeader) {
      return Buffer.concat([
      Bytes.numberToBuffer(resultsBlockHeader.protocolVersion, UINT32_SIZE),
      Bytes.numberToBuffer(resultsBlockHeader.virtualChainId, UINT32_SIZE),
      Buffer.alloc(8), //block_height
      Buffer.alloc(36), // prev_block_hash_ptr
      //Bytes.numberToBuffer(resultsBlockHeader.networkType, UINT32_SIZE),
      Bytes.numberToBuffer(resultsBlockHeader.timestamp, UINT64_SIZE),
      Bytes.numberToBuffer(SHA256_SIZE, UINT32_SIZE),
      resultsBlockHeader.receiptMerkleRoot,
      Buffer.alloc(40),
    ]);
  }

  // Builds the Results Block Proof according to:
  // +--------------------------------+------------+-----------+-------------+--------------------------+
  // |             Field              |   Offset   |   Size    |  Encoding   |          Notes           |
  // +--------------------------------+------------+-----------+-------------+--------------------------+
  // | block_proof_version            | 0          | 4         | uint32      |                          |
  // | transactions_block_hash length | 4          | always 4  | reserved    |                          |
  // | transactions_block_hash        | 8          | 32        | bytes (32B) |                          |
  // | oneof + nesting                | 40         | 12        | reserved    | oneof + proof + blockref |
  // | blockref_message               | 52         | 52        | bytes (52B) |                          |
  // | block_hash                     | 72         | 32        | bytes (32B) |                          |
  // | node_pk_sig nesting            | 104 + 100n | reserved  |             |                          |
  // | node_pk_length                 | 108 + 100n | 4         | always 20   | reserved                 |
  // | node_pk                        | 112 + 100n | 20        | bytes (20B) | Ethereum address         |
  // | node_sig_length                | 132 + 100n | 4         | always 65   | reserved                 |
  // | node_sig                       | 136 + 100n | 65        | bytes (65B) |                          |
  // +--------------------------------+------------+-----------+-------------+--------------------------+
  static buildblockRef(blockRef) {
    return Buffer.concat([
      Bytes.padToDword(Bytes.numberToBuffer(blockRef.helixMessageType, UINT16_SIZE)),
      Buffer.alloc(16),
      Bytes.numberToBuffer(SHA256_SIZE, UINT32_SIZE),
      blockRef.blockHash,
    ]); 
  }
  
  static buildResultsProof(resultsBlockProof, options = {}) {
    
    const resultsBlockProofBuffer = Buffer.concat([
//      Bytes.numberToBuffer(resultsBlockProof.blockProofVersion, 4), TODO issue #16
      Bytes.numberToBuffer(resultsBlockProof.transactionsBlockHash.length, UINT32_SIZE),
      resultsBlockProof.transactionsBlockHash,
      Buffer.alloc(12), 
      resultsBlockProof.blockrefMessage,
      Bytes.numberToBuffer(resultsBlockProof.signatures.length*100-3, UINT32_SIZE),
    ]);
    return resultsBlockProof.signatures.reduce((res, sig) => {
      const publicAddressBuffer = Bytes.prefixedHexToBuffer(sig.publicAddress);
      const signatureBuffer = Bytes.prefixedHexToBuffer(sig.signature);
      const signature_entry_size = 93;
      return Buffer.concat([res,
        Bytes.numberToBuffer(signature_entry_size, 4),
        Bytes.numberToBuffer(options.wrongPublicAddressSize || publicAddressBuffer.length, 4),
        Bytes.padToDword(publicAddressBuffer),
        Bytes.numberToBuffer(options.wrongSignatureSize || signatureBuffer.length, 4),
        Bytes.padToDword(signatureBuffer),
      ]);
    }, resultsBlockProofBuffer);
  }

  // Builds the TransactionReceipt according to:
  // +------------------+--------+----------+----------+-----------------------+
  // |      Field       | Offset |   Size   | Encoding |         Notes         |
  // +------------------+--------+----------+----------+-----------------------+
  // | execution_result |     36 | 4        | enum     | 0x1 indicates success |
  // | event length     |     40 | 4        | uint32   |                       |
  // | event data       |     44 | variable | bytes    |                       |
  // +------------------+--------+----------+----------+-----------------------+
  static buildTransactionReceipt(transaction, event, options = {}) {
    const eventBuffer = ASBProof.buildEventData(event, options);
    const argument_array_length = 12;
    return Buffer.concat([
      Buffer.alloc(36),
      Bytes.padToDword(Bytes.numberToBuffer(transaction.executionResult, UINT16_SIZE)),
      Bytes.numberToBuffer(argument_array_length, UINT32_SIZE), // argument array length 
      Buffer.alloc(argument_array_length), // argument array
      Bytes.numberToBuffer(eventBuffer.length + 4, UINT32_SIZE), // events array length
      Bytes.numberToBuffer(eventBuffer.length, UINT32_SIZE), // event length
      eventBuffer,
    ]);
  }

  // Builds the Transaction Receipt Merkle Proof according to:
  // +--------------+---------+------+-------------+
  // |    Field     | Offset  | Size |  Encoding   |
  // +--------------+---------+------+-------------+
  // | total_length | 4       |    8 | uint32      |
  // | merkle_node  | 8 + 32n |   32 | bytes (32B) |
  // +--------------+---------+------+-------------+
  static buildTransactionReceiptProof(proof) {
    return Buffer.concat([
      Bytes.numberToBuffer(proof.length * SHA256_SIZE, UINT32_SIZE),
      ...proof,
    ]);
  }

  // Builds the Autonomous Swap Event Data according to:
  // +--------------------------+--------+------+-------------+-------------------------------+
  // |          Field           | Offset | Size |  Encoding   |             Notes             |
  // +--------------------------+--------+------+-------------+-------------------------------+
  // | contract name length (N) | 0      | 4    | uint32      |                               |
  // | contract name            | 4      | N    | string      |                               |
  // | event_id                 | 4+N    | 4    | enum        | 0x1 indicates TRANSFERRED_OUT |
  // | tuid                     | 8+N    | 8    | uint64      |                               |
  // | ethereum_address length  | N+16   | 4    | always 20   | reserved                      |
  // | ethereum_address         | N+20   | 20   | bytes (20B) |                               |
  // | orbs_address length      | N+40   | 4    | always 20   | reserved                      |
  // | orbs_address             | N+44   | 20   | bytes (20B) |                               |
  // | tokens length            | N+64   | 4    | always 32   | reserved                      |
  // | tokens                   | N+68   | 32   | uint256     |                               |
  // +--------------------------+--------+------+-------------+-------------------------------+
  static buildEventData(event, options = {}) {
    const ethereumAddressBuffer = Bytes.prefixedHexToBuffer(event.ethereumAddress);
    const arguments_name = "testing";
    return Buffer.concat([
      Bytes.numberToBuffer(event.orbsContractName.length, UINT32_SIZE),
      Bytes.padToDword(Buffer.from(event.orbsContractName)),
      Bytes.numberToBuffer(event.eventName.length, UINT32_SIZE),
      Bytes.padToDword(Buffer.from(event.eventName)),
      Bytes.numberToBuffer(100, UINT32_SIZE), //array size, TODO set actual size

      Bytes.numberToBuffer(100, UINT32_SIZE), //TODO set actual size
      Bytes.numberToBuffer(arguments_name.length, UINT32_SIZE), // name size
      Bytes.padToWord(Buffer.from(arguments_name)),
      Bytes.padToDword(Bytes.numberToBuffer(7, UINT16_SIZE)), // type 
      Bytes.numberToBuffer(event.tuid, UINT64_SIZE),

      Bytes.numberToBuffer(100, UINT32_SIZE), //TODO set actual size
      Bytes.numberToBuffer(arguments_name.length, UINT32_SIZE), // name size
      Bytes.padToWord(Buffer.from(arguments_name)),
      Bytes.padToDword(Bytes.numberToBuffer(7, UINT16_SIZE)), // type
      Bytes.numberToBuffer(event.orbsAddress.length, UINT32_SIZE),
      event.orbsAddress,
      
      Bytes.numberToBuffer(100, UINT32_SIZE), //TODO set actual size
      Bytes.numberToBuffer(arguments_name.length, UINT32_SIZE), // name size
      Bytes.padToWord(Buffer.from(arguments_name)),
      Bytes.padToDword(Bytes.numberToBuffer(7, UINT16_SIZE)), // type
      Bytes.numberToBuffer(ethereumAddressBuffer.length, UINT32_SIZE),
      ethereumAddressBuffer,
      
      Bytes.numberToBuffer(100, UINT32_SIZE), //TODO set actual size
      Bytes.numberToBuffer(arguments_name.length, UINT32_SIZE), // name size
      Bytes.padToWord(Buffer.from(arguments_name)),
      Bytes.padToDword(Bytes.numberToBuffer(7, UINT16_SIZE)), // type
      //Bytes.numberToBuffer(options.wrongValueSize || UINT256_SIZE, UINT32_SIZE),
      Bytes.numberToBuffer(event.value, UINT64_SIZE),
    ]);
  }
}

module.exports = ASBProof;

import Bytes from './bytes';

const UINT32_SIZE = 4;
const UINT64_SIZE = 8;
const UINT256_SIZE = 32;
const ADDRESS_SIZE = 20;
const ORBS_ADDRESS_SIZE = 20;
const SHA256_SIZE = UINT256_SIZE;
const SIGNATURE_SIZE = 65;

class ASBProof {
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
      Bytes.numberToBuffer(resultsBlockHeader.virtualChainId, UINT64_SIZE),
      Bytes.numberToBuffer(resultsBlockHeader.networkType, UINT32_SIZE),
      Bytes.numberToBuffer(resultsBlockHeader.timestamp, UINT64_SIZE),
      Buffer.alloc(40),
      resultsBlockHeader.receiptMerkleRoot,
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
  static buildResultsProof(resultsBlockProof) {
    const resultsBlockProofBuffer = Buffer.concat([
      Bytes.numberToBuffer(resultsBlockProof.blockProofVersion, 4),
      Bytes.numberToBuffer(SHA256_SIZE, 4),
      resultsBlockProof.transactionsBlockHash,
      Buffer.alloc(12), // one-of + nesting
      resultsBlockProof.blockrefMessage,
    ]);

    return resultsBlockProof.signatures.reduce((res, sig) => {
      return Buffer.concat([res,
        Buffer.alloc(4), // node_pk_sig nesting
        Bytes.numberToBuffer(ADDRESS_SIZE, 4),
        Bytes.addressToBuffer(sig.publicAddress),
        Bytes.numberToBuffer(SIGNATURE_SIZE, 4),
        Bytes.addressToBuffer(sig.signature),
      ]);
    }, resultsBlockProofBuffer);
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
  static buildEventData(event) {
    return Buffer.concat([
      Bytes.numberToBuffer(event.orbsContractName.length, UINT32_SIZE),
      Buffer.from(event.orbsContractName),
      Bytes.numberToBuffer(event.eventId, UINT32_SIZE),
      Bytes.numberToBuffer(event.tuid, UINT64_SIZE),
      Bytes.numberToBuffer(ORBS_ADDRESS_SIZE, UINT32_SIZE),
      event.orbsAddress,
      Bytes.numberToBuffer(ADDRESS_SIZE, UINT32_SIZE),
      Bytes.addressToBuffer(event.ethereumAddress),
      Bytes.numberToBuffer(UINT256_SIZE, UINT32_SIZE),
      Bytes.numberToBuffer(event.value, UINT256_SIZE),
    ]);
  }
}

class ASBProofBuilder {
  constructor(token, federation, verifier) {
    this.token = token;
    this.federation = federation;
    this.verifier = verifier;
  }
}

module.exports = { ASBProof, ASBProofBuilder };

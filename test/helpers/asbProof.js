import Bytes from './bytes';

const UINT32_SIZE = 4;
const UINT64_SIZE = 8;
const UINT256_SIZE = 32;
const ADDRESS_SIZE = 20;

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
  // | tokens length            | N+40   | 4    | always 32   | reserved                      |
  // | tokens                   | N+44   | 32   | uint256     |                               |
  // +--------------------------+--------+------+-------------+-------------------------------+
  static buildEventData(event) {
    return Buffer.concat([
      Bytes.numberToBuffer(event.orbsContractName.length, UINT32_SIZE),
      Buffer.from(event.orbsContractName),
      Bytes.numberToBuffer(event.eventId, UINT32_SIZE),
      Bytes.numberToBuffer(event.tuid, UINT64_SIZE),
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

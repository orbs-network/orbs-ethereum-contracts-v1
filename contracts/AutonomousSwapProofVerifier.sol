pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./IAutonomousSwapProofVerifier.sol";
import "./BytesLibEx.sol";
import "./CryptoUtils.sol";


/// @title ASB proof verification library
contract AutonomousSwapProofVerifier is IAutonomousSwapProofVerifier {
    using SafeMath for uint256;
    using BytesLib for bytes;
    using BytesLibEx for bytes;

    // The version of the current proof verifier library.
    string public constant VERSION = "0.1";

    // Data sizes (in bytes).
    uint public constant UINT32_SIZE = 4;
    uint public constant UINT64_SIZE = 8;
    uint public constant UINT256_SIZE = 32;
    uint public constant ADDRESS_SIZE = 20;
    uint public constant SHA256_SIZE = UINT256_SIZE;
    uint public constant SIGNATURE_SIZE = 65;

    // Orbs specific data sizes (in bytes).
    uint public constant ORBS_ADDRESS_SIZE = 20;
    uint public constant ONEOF_NESTING_SIZE = 12;
    uint public constant BLOCKREFMESSAGE_SIZE = 52;
    uint public constant BLOCKHASH_OFFSET = 20;
    uint public constant NODE_PK_SIG_NESTING_SIZE = 4;

    // The maximum supported number of signatures in Results Block Proof. We have to limit this number and fallback to
    // statically sized lists, due to Solidity's inability of functions returning dynamic arrays (and limiting gas
    // consumption, of course).
    uint public constant MAX_SIGNATURES = 32;

    /// @dev Parses and validates the raw transfer proof.
    /// @param _proof bytes The raw transfer proof.
    /// @return from bytes20 from The Orbs address to transfer from.
    /// @return to address The address to transfer to.
    /// @return value uint256 The amount to be transferred.
    /// @return networkType uint32 The network type of the Orbs network this contract is compatible for.
    /// @return virtualChainId uint64 The virtual chain ID of the underlying token on the Orbs network.
    /// @return tuid uint256 The TUID of the corresponding transaction.
    function processProof(bytes _proof) public pure returns(bytes20 from, address to, uint256 value,
        uint32 networkType, uint64 virtualChainId, uint256 tuid) {
        // TODO: implement the finalized proof spec.
    }

    /// Parses Results Block Header according to:
    /// +---------------------+--------+------+----------------------+
    /// |        Field        | Offset | Size |       Encoding       |
    /// +---------------------+--------+------+----------------------+
    /// | protocol_version    |      0 |    4 | uint32               |
    /// | virtual_chain_id    |      4 |    8 | uint64               |
    /// | network_type        |     12 |    4 | enum (4 bytes)       |
    /// | timestamp           |     16 |    8 | uint64 unix 64b time |
    /// | receipt_merkle_root |     64 |   32 | bytes (32B)          |
    /// +---------------------+--------+------+----------------------+
    /// @param _resultsBlockHeader bytes The serialized data.
    /// @return protocolVersion uint32 The version of the proof protocol.
    /// @return virtualChainId uint64 The virtual chain ID of the underlying token on the Orbs network.
    /// @return networkType uint32 The network type of the Orbs network this contract is compatible for.
    /// @return timestamp uint64 The unix timestamp corresponding to the proof.
    /// @return transactionReceiptMerkleRoot bytes32 The SHA256 receipt Merkle root.
    function parseResultsBlockHeader(bytes _resultsBlockHeader) public pure returns (uint32 protocolVersion,
        uint64 virtualChainId, uint32 networkType, uint64 timestamp, bytes32 transactionReceiptMerkleRoot) {
        uint offset = 0;

        protocolVersion = _resultsBlockHeader.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        virtualChainId = _resultsBlockHeader.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        networkType = _resultsBlockHeader.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        timestamp = _resultsBlockHeader.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        offset = offset.add(40); // Jump to receipt_merkle_root.

        transactionReceiptMerkleRoot = _resultsBlockHeader.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);
    }

    /// @dev Parses Results Block Proof according to:
    /// +--------------------------------+------------+-----------+-------------+--------------------------+
    /// |             Field              |   Offset   |   Size    |  Encoding   |          Notes           |
    /// +--------------------------------+------------+-----------+-------------+--------------------------+
    /// | block_proof_version            | 0          | 4         | uint32      |                          |
    /// | transactions_block_hash length | 4          | always 4  | reserved    |                          |
    /// | transactions_block_hash        | 8          | 32        | bytes (32B) |                          |
    /// | oneof + nesting                | 40         | 12        | reserved    | oneof + proof + blockref |
    /// | blockref_message               | 52         | 52        | bytes (52B) |                          |
    /// | block_hash                     | 72         | 32        | bytes (32B) |                          |
    /// | node_pk_sig nesting            | 104 + 100n | reserved  |             |                          |
    /// | node_pk_length                 | 108 + 100n | 4         | always 20   | reserved                 |
    /// | node_pk                        | 112 + 100n | 20        | bytes (20B) | Ethereum address         |
    /// | node_sig_length                | 132 + 100n | 4         | always 65   | reserved                 |
    /// | node_sig                       | 136 + 100n | 65        | bytes (65B) |                          |
    /// +--------------------------------+------------+-----------+-------------+--------------------------+
    /// @param _resultsBlockProof bytes The serialized data.
    /// @return blockProofVersion uint32 The version of the block proof (== the federation revision).
    /// @return transactionsBlockHash bytes32 The hash of the transactions block.
    /// @return blockrefHash bytes32 The hash of the block reference.
    /// @return blockHash bytes32 The hash of the block.
    /// @return numOfSignatures uint The number of signatures in the Results Block Proof.
    /// @return publicAddresses address[MAX_SIGNATURES] The public addresses of the signing federation members.
    /// @return signatures bytes[MAX_SIGNATURES] The respective signatures by the signing federation members.
    function parseResultsBlockProof(bytes _resultsBlockProof) public pure returns (uint32 blockProofVersion,
        bytes32 transactionsBlockHash, bytes32 blockrefHash, bytes32 blockHash, uint numOfSignatures,
        address[MAX_SIGNATURES] publicAddresses, bytes[MAX_SIGNATURES] signatures) {
        uint offset = 0;

        blockProofVersion = _resultsBlockProof.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        uint32 transactionsBlockHashSize =_resultsBlockProof.toUint32BE(offset);
        require(transactionsBlockHashSize == SHA256_SIZE, "Invalid hash size!");
        offset = offset.add(UINT32_SIZE);
        transactionsBlockHash = _resultsBlockProof.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);

        offset = offset.add(ONEOF_NESTING_SIZE); // oneof + nesting
        blockrefHash = keccak256(_resultsBlockProof.slice(offset, BLOCKREFMESSAGE_SIZE));
        offset = offset.add(BLOCKHASH_OFFSET);

        blockHash = _resultsBlockProof.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);

        // Note: in the case that the remaining buffer is too small - we will either revert in SafeMath or in
        // BytesUtils/Ex.
        while (offset < _resultsBlockProof.length) {
            offset = offset.add(NODE_PK_SIG_NESTING_SIZE); // node_pk_sig nesting

            uint32 publicAddressSize =_resultsBlockProof.toUint32BE(offset);
            require(publicAddressSize == ADDRESS_SIZE, "Invalid address size!");
            offset = offset.add(UINT32_SIZE);
            publicAddresses[numOfSignatures] = _resultsBlockProof.toAddress(offset);
            offset = offset.add(ADDRESS_SIZE);

            uint32 signatureSize =_resultsBlockProof.toUint32BE(offset);
            require(signatureSize == SIGNATURE_SIZE, "Invalid signature size!");
            offset = offset.add(UINT32_SIZE);
            signatures[numOfSignatures] = _resultsBlockProof.slice(offset, SIGNATURE_SIZE);
            offset = offset.add(SIGNATURE_SIZE);

            numOfSignatures = numOfSignatures.add(1);
        }
    }

    /// @dev Parses Autonomous Swap Event Data according to:
    /// +--------------------------+--------+------+-------------+-------------------------------+
    /// |          Field           | Offset | Size |  Encoding   |             Notes             |
    /// +--------------------------+--------+------+-------------+-------------------------------+
    /// | contract name length (N) | 0      | 4    | uint32      |                               |
    /// | contract name            | 4      | N    | string      |                               |
    /// | event_id                 | 4+N    | 4    | enum        | 0x1 indicates TRANSFERRED_OUT |
    /// | tuid                     | 8+N    | 8    | uint64      |                               |
    /// | ethereum_address length  | N+16   | 4    | always 20   | reserved                      |
    /// | ethereum_address         | N+20   | 20   | bytes (20B) |                               |
    /// | orbs_address length      | N+40   | 4    | always 20   | reserved                      |
    /// | orbs_address             | N+44   | 20   | bytes (20B) |                               |
    /// | tokens length            | N+64   | 4    | always 32   | reserved                      |
    /// | tokens                   | N+68   | 32   | uint256     |                               |
    /// +--------------------------+--------+------+-------------+-------------------------------+
    /// @param _eventData bytes The serialized event data.
    /// @return contractName string The name of Orbs contract name which has emitted the event.
    /// @return eventId uint32 The ID of the event (enum).
    /// @return tuid uint64 The Orbs TUID corresponding to the event.
    /// @return from bytes20 from The Orbs address to transfer from.
    /// @return to address The address to transfer to.
    /// @return uint256 The amount to be transferred.
    function parseEventData(bytes _eventData) public pure returns (string orbsContractName, uint32 eventId, uint64 tuid,
        bytes20 from, address to, uint256 value) {
        uint offset = 0;

        uint32 orbsContractNameLength = _eventData.toUint32BE(0);
        offset = offset.add(UINT32_SIZE);
        orbsContractName = string(_eventData.slice(offset, orbsContractNameLength));
        offset = offset.add(orbsContractNameLength);

        eventId = _eventData.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        tuid = _eventData.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        uint32 fromAddressSize =_eventData.toUint32BE(offset);
        require(fromAddressSize == ORBS_ADDRESS_SIZE, "Invalid Orbs address size!");
        offset = offset.add(UINT32_SIZE);
        from = _eventData.toBytes20(offset);
        offset = offset.add(ORBS_ADDRESS_SIZE);

        uint32 toAddressSize =_eventData.toUint32BE(offset);
        require(toAddressSize == ADDRESS_SIZE, "Invalid Ethereum address size!");
        offset = offset.add(UINT32_SIZE);
        to = _eventData.toAddress(offset);
        offset = offset.add(ADDRESS_SIZE);

        uint32 valueSize =_eventData.toUint32BE(offset);
        require(valueSize == UINT256_SIZE, "Invalid value size!");
        offset = offset.add(UINT32_SIZE);
        value = _eventData.toUintBE(offset);
        offset = offset.add(UINT256_SIZE);
    }

    /// @dev Checks Orbs address for correctness.
    /// @param _address bytes20 The Orbs address to check.
    function isOrbsAddressValid(bytes20 _address) public pure returns (bool) {
        // Check for empty address.
        if (_address == bytes20(0)) {
            return false;
        }

        return true;
    }

    // Debug
    event XXX(bytes data);
    event AAA(uint32 i);
    event BBB(uint64 i);
    event CCC(uint256 i);
}

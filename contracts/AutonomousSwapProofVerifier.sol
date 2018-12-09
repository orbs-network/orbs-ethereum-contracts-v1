pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./IAutonomousSwapProofVerifier.sol";
import "./IFederation.sol";
import "./BytesLibEx.sol";
import "./CryptoUtils.sol";


/// @title ASB proof verification library
contract AutonomousSwapProofVerifier is IAutonomousSwapProofVerifier {
    using SafeMath for uint8;
    using SafeMath for uint256;
    using BytesLib for bytes;
    using BytesLibEx for bytes;

    // The version of the current proof verifier library.
    uint public constant VERSION = 1;

    // The supported Orbs protocol version.
    uint public constant ORBS_PROTOCOL_VERSION = 2;

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
    uint public constant EXECUTION_RESULT_OFFSET = 36;

    // Orbs protocol values:
    uint public constant TRANSFERRED_OUT = 1;
    uint public constant EXECUTION_RESULT_SUCCESS = 1;

    // The maximum supported number of signatures in Results Block Proof. We have to limit this number and fallback to
    // statically sized lists, due to Solidity's inability of functions returning dynamic arrays (and limiting gas
    // consumption, of course).
    uint public constant MAX_SIGNATURES = 32;

    struct ResultsBlockHeader {
        uint32 protocolVersion;
        uint64 virtualChainId;
        uint32 networkType;
        uint64 timestamp;
        bytes32 transactionReceiptMerkleRoot;
    }

    struct ResultsBlockProof {
        uint32 blockProofVersion;
        bytes32 transactionsBlockHash;
        bytes32 blockrefHash;
        bytes32 blockHash;
        uint8 numOfSignatures;
        address[MAX_SIGNATURES] publicAddresses;
        bytes[MAX_SIGNATURES] signatures;
    }

    struct TransactionReceipt {
        uint32 executionResult;
        bytes eventData;
    }

    struct EventData {
        string orbsContractName;
        uint32 eventId;
        uint64 tuid;
        bytes20 from;
        address to;
        uint256 value;
    }

    // The federation smart contract.
    IFederation public federation;

    /// @dev Constructor that initializes the ASB Proof Verifier contract.
    /// @param _federation IFederation The federation smart contract.
    constructor(IFederation _federation) public {
        require(address(_federation) != address(0), "Federation must not be 0!");

        federation = _federation;
    }

    /// @dev Parses and validates the raw transfer proof. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _resultsBlockHeader bytes The raw Results Block Header.
    /// @param _resultsBlockProof bytes The raw Results Block Proof.
    /// @param _transactionReceipt bytes The raw Transaction Receipt.
    /// @return transferInEvent TransferInEvent The TransferIn event data.
    function processProof(bytes _resultsBlockHeader, bytes _resultsBlockProof, bytes _transactionReceipt,
        bytes32[] _transactionReceiptProof) public view returns(TransferInEvent memory transferInEvent) {

        // Parse Results Block Header:
        ResultsBlockHeader memory header = parseResultsBlockHeader(_resultsBlockHeader);

        // Verify that the Orbs protocol is supported.
        require(header.protocolVersion == ORBS_PROTOCOL_VERSION, "Unsupported protocol version!");

        // Verify that Result Block Proof by matching hashes and making sure that enough federation members have signed
        // it.
        verifyResultBlockProof(_resultsBlockHeader, _resultsBlockProof);

        // Verify the existence of the Transaction Receipt.
        require(CryptoUtils.isMerkleProofValid(_transactionReceiptProof, header.transactionReceiptMerkleRoot,
            _transactionReceipt), "Invalid transaction receipt proof!");

        // Parse the Transaction Receipt.
        TransactionReceipt memory transactionReceipt = parseTransactionReceipt(_transactionReceipt);

        // Verify transaction's execution result.
        require(transactionReceipt.executionResult == EXECUTION_RESULT_SUCCESS, "Invalid execution result!");

        // Extract the Autonomous Swap Event Data from the transaction receipt:
        EventData memory eventData = parseEventData(transactionReceipt.eventData);

        // Verify that the event is a TRANSFERRED_OUT event:
        require(eventData.eventId == TRANSFERRED_OUT, "Invalid event ID!");

        // Assign the rest of the fields.
        transferInEvent.networkType = header.networkType;
        transferInEvent.virtualChainId = header.virtualChainId;
        transferInEvent.orbsContractName = eventData.orbsContractName;
        transferInEvent.from = eventData.from;
        transferInEvent.to = eventData.to;
        transferInEvent.value = eventData.value;
        transferInEvent.tuid = eventData.tuid;
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
    /// @param _resultsBlockHeader bytes The raw Results Block Header data.
    /// @return res ResultsBlockHeader The parsed Results Block Header.
    function parseResultsBlockHeader(bytes _resultsBlockHeader) internal pure returns (ResultsBlockHeader memory res) {
        uint offset = 0;

        res.protocolVersion = _resultsBlockHeader.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        res.virtualChainId = _resultsBlockHeader.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        res.networkType = _resultsBlockHeader.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        res.timestamp = _resultsBlockHeader.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        offset = offset.add(40); // Jump to receipt_merkle_root.

        res.transactionReceiptMerkleRoot = _resultsBlockHeader.toBytes32(offset);
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
    /// @param _resultsBlockProof bytes The raw Results Block Proof data.
    /// @return res ResultsBlockProof The parsed Results Block Proof.
    function parseResultsBlockProof(bytes _resultsBlockProof) internal pure returns (ResultsBlockProof memory res) {
        uint offset = 0;

        res.blockProofVersion = _resultsBlockProof.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        uint32 transactionsBlockHashSize =_resultsBlockProof.toUint32BE(offset);
        require(transactionsBlockHashSize == SHA256_SIZE, "Invalid hash size!");
        offset = offset.add(UINT32_SIZE);
        res.transactionsBlockHash = _resultsBlockProof.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);

        offset = offset.add(ONEOF_NESTING_SIZE); // oneof + nesting
        res.blockrefHash = sha256(_resultsBlockProof.slice(offset, BLOCKREFMESSAGE_SIZE));
        offset = offset.add(BLOCKHASH_OFFSET);

        res.blockHash = _resultsBlockProof.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);

        // Note: in the case that the remaining buffer is too small - we will either revert in SafeMath or in
        // BytesUtils/Ex.
        while (offset < _resultsBlockProof.length) {
            offset = offset.add(NODE_PK_SIG_NESTING_SIZE); // node_pk_sig nesting

            uint32 publicAddressSize =_resultsBlockProof.toUint32BE(offset);
            require(publicAddressSize == ADDRESS_SIZE, "Invalid address size!");
            offset = offset.add(UINT32_SIZE);
            res.publicAddresses[res.numOfSignatures] = _resultsBlockProof.toAddress(offset);
            offset = offset.add(ADDRESS_SIZE);

            uint32 signatureSize =_resultsBlockProof.toUint32BE(offset);
            require(signatureSize == SIGNATURE_SIZE, "Invalid signature size!");
            offset = offset.add(UINT32_SIZE);
            res.signatures[res.numOfSignatures] = _resultsBlockProof.slice(offset, SIGNATURE_SIZE);
            offset = offset.add(SIGNATURE_SIZE);

            res.numOfSignatures = uint8(res.numOfSignatures.add(1));
        }
    }

    /// @dev Parses the Transaction Receipt according to:
    /// Builds the TransactionReceipt according to:
    /// +------------------+--------+----------+----------+-----------------------+
    /// |      Field       | Offset |   Size   | Encoding |         Notes         |
    /// +------------------+--------+----------+----------+-----------------------+
    /// | execution_result |     36 | 4        | enum     | 0x1 indicates success |
    /// | event length     |     40 | 4        | uint32   |                       |
    /// | event data       |     44 | variable | bytes    |                       |
    /// +------------------+--------+----------+----------+-----------------------+
    /// @param _transactionReceipt bytes The raw Transaction Receipt data.
    /// @return res TransactionReceipt The parsed Transaction Receipt.
    function parseTransactionReceipt(bytes _transactionReceipt) internal pure returns(TransactionReceipt memory res) {
        uint offset = 0;

        offset = offset.add(EXECUTION_RESULT_OFFSET);

        res.executionResult = _transactionReceipt.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        uint32 eventDataLength =_transactionReceipt.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);
        res.eventData = _transactionReceipt.slice(offset, eventDataLength);
        offset = offset.add(eventDataLength);
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
    /// @param _eventData bytes The raw event data.
    /// @return res EventData The parsed Autonomous Swap Event Data.
    function parseEventData(bytes _eventData) internal pure returns (EventData memory res) {
        uint offset = 0;

        uint32 orbsContractNameLength = _eventData.toUint32BE(0);
        offset = offset.add(UINT32_SIZE);
        res.orbsContractName = string(_eventData.slice(offset, orbsContractNameLength));
        offset = offset.add(orbsContractNameLength);

        res.eventId = _eventData.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        res.tuid = _eventData.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        uint32 fromAddressSize =_eventData.toUint32BE(offset);
        require(fromAddressSize == ORBS_ADDRESS_SIZE, "Invalid Orbs address size!");
        offset = offset.add(UINT32_SIZE);
        res.from = _eventData.toBytes20(offset);
        offset = offset.add(ORBS_ADDRESS_SIZE);

        uint32 toAddressSize =_eventData.toUint32BE(offset);
        require(toAddressSize == ADDRESS_SIZE, "Invalid Ethereum address size!");
        offset = offset.add(UINT32_SIZE);
        res.to = _eventData.toAddress(offset);
        offset = offset.add(ADDRESS_SIZE);

        uint32 valueSize =_eventData.toUint32BE(offset);
        require(valueSize == UINT256_SIZE, "Invalid value size!");
        offset = offset.add(UINT32_SIZE);
        res.value = _eventData.toUintBE(offset);
        offset = offset.add(UINT256_SIZE);
    }

    /// @dev Verifies federation members signatures on the blockref message.
    /// @param proof ResultsBlockProof The proof data.
    function isSignatureValid(ResultsBlockProof memory proof) internal view returns (bool) {
        uint requiredThreshold = federation.getConsensusThresholdByRevision(proof.blockProofVersion);
        uint currentThreshold = 0;

        // Since Solidity doesn't support dynamic arrays in memory, we will use a fixed sizes addresses array for
        // looking for duplicates: a[i] == address(0) would mean that signature[i] is duplicated.
        address[] memory duplicatesLookup = new address[](proof.numOfSignatures);

        for (uint i = 0; i < proof.numOfSignatures; ++i) {
            address signer = proof.publicAddresses[i];
            bytes memory signature = proof.signatures[i];

            // Check if the signer is a member of the federation, at the time of the creation of the proof.
            if (!federation.isMemberByRevision(proof.blockProofVersion, signer)) {
                continue;
            }

            // Verify that the signature is correct.
            if (!CryptoUtils.isSignatureValid(proof.blockrefHash, signature, signer)) {
                continue;
            }

            // Verify that the signature isn't duplicated.
            bool unique = true;
            for (uint j = 0; j < duplicatesLookup.length; ++j) {
                if (signer == duplicatesLookup[j]) {
                    unique = false;
                    break;
                }
            }

            if (!unique) {
                continue;
            }

            duplicatesLookup[i] = signer;

            // If we've reached so far, then this is a valid signature indeed and should be take into the account. If
            // we have collected enough signatures - we can stop and return true.
            currentThreshold = currentThreshold.add(1);
            if (currentThreshold >= requiredThreshold) {
                return true;
            }
        }

        return false;
    }

    function verifyResultBlockProof(bytes _resultsBlockHeader, bytes _resultsBlockProof) private view {
        ResultsBlockProof memory proof = parseResultsBlockProof(_resultsBlockProof);

        // Verify the block hash.
        bytes32 resultsBlockHeaderHash = sha256(_resultsBlockHeader);
        bytes32 calculatedBlockHash = sha256(abi.encodePacked(proof.transactionsBlockHash, resultsBlockHeaderHash));
        require(calculatedBlockHash == proof.blockHash, "Block hash doesn't match!");

        // Verify federation members signatures on the blockref message.
        require(isSignatureValid(proof), "Invalid signature!");
    }
}

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./IAutonomousSwapProofVerifier.sol";
import "./IFederation.sol";
import "./BytesLibEx.sol";
import "./CryptoUtils.sol";
import "./StringUtils.sol";


/// @title ASB proof verification library
contract AutonomousSwapProofVerifier is IAutonomousSwapProofVerifier {
    using SafeMath for uint8;
    using SafeMath for uint256;
    using BytesLib for bytes;
    using BytesLibEx for bytes;
    using StringUtils for string;

    // The version of the current proof verifier library.
    uint public constant VERSION = 1;

    // The supported Orbs protocol version.
    uint public constant ORBS_PROTOCOL_VERSION = 1;

    // Data sizes (in bytes).
    uint public constant UINT16_SIZE = 2;
    uint public constant UINT32_SIZE = 4;
    uint public constant UINT64_SIZE = 8;
    uint public constant UINT256_SIZE = 32;
    uint public constant ADDRESS_SIZE = 20;
    uint public constant SHA256_SIZE = UINT256_SIZE;
    uint public constant SIGNATURE_SIZE = 65;
    uint public constant SIGNATURE_PADDED_SIZE = 68;
    uint public constant ENUM_PADDED_SIZE = 4;
    uint public constant LENGTH_SIZE = 4;

    // Orbs specific data sizes (in bytes).
    uint public constant ORBS_ADDRESS_SIZE = 20;
    uint public constant ONEOF_NESTING_SIZE = 12;
    uint public constant BLOCKREFMESSAGE_SIZE = 56;
    uint public constant BLOCKHASH_OFFSET = 24;
    uint public constant NODE_PK_SIG_NESTING_SIZE = 4;
    uint public constant SENDER_SIGNATURE_SIZE = 100;

    // Orbs protocol values:
    string public constant TRANSFERRED_OUT_EVENT_NAME = 'TransferredOut';
    uint public constant EXECUTION_RESULT_SUCCESS = 1;
    uint public constant COMMIT_MESSAGE_TYPE = 3;
    uint public constant DWORD_ALIGNED = 4;
    uint public constant WORD_ALIGNED = 2;

    // The maximum supported number of signatures in Results Block Proof. We have to limit this number and fallback to
    // statically sized lists, due to Solidity's inability of functions returning dynamic arrays (and limiting gas
    // consumption, of course).
    uint public constant MAX_SIGNATURES = 100;

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
        uint16 helixMessageType;
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
        string eventName;
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

    /// @dev Parses the receipt proof and calls processProof to process the proof data.
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _packedProof bytes The raw proof (including the resultsBlockHeader, resultsBlockProof and 
    /// transactionReceiptProof.
    function parsePackedProof(bytes _packedProof) internal pure returns(bytes resultsBlockHeader, 
    bytes resultsBlockProof, bytes packedTransactionReceiptProof) {
        uint offset = 0;

        // Parse the packedProof
        // message ReceiptProof {
        //     protocol.ResultsBlockHeader header = 1;
        //     protocol.ResultsBlockProof block_proof = 2;
        //     primitives.merkle_tree_proof receipt_proof = 3;
        // }

        /// protocol.ResultsBlockHeader header (bytes)
        uint32 resultsBlockHeaderSize =_packedProof.toUint32BE(offset);
        offset = offset.add(LENGTH_SIZE);
        resultsBlockHeader = _packedProof.slice(offset, resultsBlockHeaderSize);
        offset = offset.add(resultsBlockHeaderSize);

        /// protocol.ResultsBlockProof block_proof (bytes)
        uint32 resultsBlockProofSize =_packedProof.toUint32BE(offset);
        offset = offset.add(LENGTH_SIZE);
        resultsBlockProof = _packedProof.slice(offset, resultsBlockProofSize);
        offset = offset.add(resultsBlockProofSize);

        /// primitives.merkle_tree_proof receipt_proof (bytes)
        uint32 transactionReceiptProofSize =_packedProof.toUint32BE(offset);
        offset = offset.add(LENGTH_SIZE);
        packedTransactionReceiptProof = _packedProof.slice(offset, transactionReceiptProofSize);
        offset = offset.add(transactionReceiptProofSize);    
    }

    /// @dev Parses and validates the raw transfer proof. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _packedProof bytes The raw proof (including the resultsBlockHeader, resultsBlockProof and 
    /// @param _transactionReceipt bytes The raw Transaction Receipt.
    /// @return transferInEvent TransferInEvent The TransferIn event data.
    function processPackedProof(bytes _packedProof, bytes _transactionReceipt) public view returns(TransferInEvent memory transferInEvent) {
        bytes memory resultsBlockHeader;
        bytes memory resultsBlockProof;
        bytes memory packedTransactionReceiptProof;

        (resultsBlockHeader, resultsBlockProof, packedTransactionReceiptProof) = parsePackedProof(_packedProof);


        uint numOfNodes = packedTransactionReceiptProof.length.div(32);

        uint offset = 0;
        bytes32[] memory transactionReceiptProof = new bytes32[](numOfNodes);
        for (uint i = 0; i < numOfNodes; ++i) {
            bytes32 node = packedTransactionReceiptProof.toBytes32(offset);
            transactionReceiptProof[i] = node;
            offset = offset.add(UINT256_SIZE);
        }

        TransferInEvent memory eventData = processProof(resultsBlockHeader, resultsBlockProof, _transactionReceipt, transactionReceiptProof);
        transferInEvent.networkType = eventData.networkType;
        transferInEvent.virtualChainId = eventData.virtualChainId;
        transferInEvent.orbsContractName = eventData.orbsContractName;
        transferInEvent.from = eventData.from;
        transferInEvent.to = eventData.to;
        transferInEvent.value = eventData.value;
        transferInEvent.tuid = eventData.tuid;
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

        // Verify that the event is a TransfferedOut event: TODO - modify to filter of multipel events
        require(eventData.eventName.equal(TRANSFERRED_OUT_EVENT_NAME), "Incorrect event name!");

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
        // primitives.protocol_version protocol_version = 1;
        res.protocolVersion = _resultsBlockHeader.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);
        
        // primitives.virtual_chain_id virtual_chain_id = 2;
        res.virtualChainId = _resultsBlockHeader.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        // primitives.block_height block_height = 3;
        offset = offset.add(UINT64_SIZE);

        // primitives.sha256 prev_block_hash_ptr = 4;
        offset = offset.add(UINT32_SIZE);
        offset = offset.add(UINT256_SIZE);


        //    res.networkType = _resultsBlockHeader.toUint32BE(offset);
        //    offset = offset.add(UINT32_SIZE);

        // primitives.timestamp_nano timestamp = 5;
        res.timestamp = _resultsBlockHeader.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);
        
        // primitives.merkle_sha256 receipts_root_hash = 6;
        offset = offset.add(UINT32_SIZE);
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

//        res.blockProofVersion = _resultsBlockProof.toUint32BE(offset); TODO
//        offset = offset.add(UINT32_SIZE);
        res.blockProofVersion = 0; //TODO

        // primitives.sha256 results_block_hash = 1;
        uint32 transactionsBlockHashSize =_resultsBlockProof.toUint32BE(offset);
        require(transactionsBlockHashSize == SHA256_SIZE, "Invalid hash size!");
        offset = offset.add(UINT32_SIZE);
        res.transactionsBlockHash = _resultsBlockProof.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);

        // oneof type , message LeanHelixBlockProof, message LeanHelixBlockRef
        offset = offset.add(ONEOF_NESTING_SIZE); // oneof + nesting
        res.blockrefHash = sha256(_resultsBlockProof.slice(offset, BLOCKREFMESSAGE_SIZE));

        // LeanHelixMessageType message_type = 1;
        res.helixMessageType = _resultsBlockProof.toUint16BE(offset);
        
        offset = offset.add(BLOCKHASH_OFFSET);
        res.blockHash = _resultsBlockProof.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);

        // Note: in the case that the remaining buffer is too small - we will either revert in SafeMath or in
        // BytesUtils/Ex.

        uint signers_offset = 0;
        uint signersArrayLength = _resultsBlockProof.toUint32BE(offset);
        offset = offset.add(LENGTH_SIZE);
        while (signers_offset < signersArrayLength) {
            offset = offset.add(LENGTH_SIZE);

            uint32 publicAddressSize =_resultsBlockProof.toUint32BE(offset);
            require(publicAddressSize == ORBS_ADDRESS_SIZE, "Invalid address size!");
            offset = offset.add(UINT32_SIZE);
            res.publicAddresses[res.numOfSignatures] = _resultsBlockProof.toAddress(offset);
            offset = offset.add(ADDRESS_SIZE);

            uint32 signatureSize =_resultsBlockProof.toUint32BE(offset);
            require(signatureSize == SIGNATURE_SIZE, "Invalid signature size!");
            offset = offset.add(UINT32_SIZE);
            res.signatures[res.numOfSignatures] = _resultsBlockProof.slice(offset, SIGNATURE_SIZE);
            offset = offset.add(SIGNATURE_PADDED_SIZE);

            res.numOfSignatures = uint8(res.numOfSignatures.add(1));
            signers_offset = signers_offset.add(SENDER_SIGNATURE_SIZE);
        }
    }

    function ParseVariableSizeField(uint _offset, bytes _data, uint _next_alignment) internal pure returns (uint next_offset, uint field_offset, uint field_length) {
        field_length =_data.toUint32BE(_offset);  
        field_offset = _offset.add(LENGTH_SIZE);
        next_offset = field_offset.add(field_length);
        next_offset = next_offset.add(_next_alignment - 1);
        uint next_offset_mod = next_offset.mod(_next_alignment);
        next_offset = next_offset.sub(next_offset_mod);
    }

    function PraseUint16(uint _offset, uint _next_alignment) internal pure returns (uint next_offset) {
        next_offset = _offset.add(UINT16_SIZE);
        next_offset = next_offset.add(_next_alignment - 1);
        uint next_offset_mod = next_offset.mod(_next_alignment);
        next_offset = next_offset.sub(next_offset_mod);
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
    /// 
    /// message TransactionReceipt {
    ///     primitives.sha256 txhash = 1;
    ///     protocol.ExecutionResult execution_result = 2;
    ///     bytes output_argument_array = 3;
    ///     bytes output_events_array = 4; // opaque field of repeated protocol.Event
    /// }
    ///
    /// @param _transactionReceipt bytes The raw Transaction Receipt data.
    /// @return res TransactionReceipt The parsed Transaction Receipt.

    function parseTransactionReceipt(bytes _transactionReceipt) internal pure returns(TransactionReceipt memory res) {
        uint offset = 0;
        /// primitives.sha256 txhash (bytes, reserved)
        offset = offset.add(LENGTH_SIZE);
        offset = offset.add(SHA256_SIZE);        

        /// protocol.ExecutionResult execution_result (enum)
        res.executionResult = _transactionReceipt.toUint16BE(offset);
        offset = offset.add(ENUM_PADDED_SIZE);

        /// bytes output_argument_array (reserved)
        (offset, , ) = ParseVariableSizeField(offset, _transactionReceipt, DWORD_ALIGNED);

        /// bytes output_events_array 
        uint32 eventArrayLength =_transactionReceipt.toUint32BE(offset);
        offset = offset.add(LENGTH_SIZE);

        // first event - TODO multiple events
        uint32 eventLength =_transactionReceipt.toUint32BE(offset);
        offset = offset.add(LENGTH_SIZE);
        res.eventData = _transactionReceipt.slice(offset, eventLength);
        offset = offset.add(eventLength);
        
        require(eventArrayLength == eventLength + 4, "Multiple Events - only a single event is supported!");

    }

    /// @dev Parses Autonomous Swap Event Data according to:
    /// +--------------------------+--------+------+--------------+-------------------------------+
    /// |          Field           | Offset | Size |  Encoding    |             Notes             |
    /// +--------------------------+--------+------+--------------+-------------------------------+
    /// | contract name length (N) | 0      | 4    | uint32       |                               |
    /// | contract name            | 4      | N    | string       |                               |
    /// | event name length (K)    | N+4    | 4    | uint32       |                               |
    /// | event name               | N+8    | K    | string       |                               |
    /// | arguments_length         | N+K+8  | 4    | uint32       |                               |
    /// | tuid_type                | N+K+12 | 2(4) | enum (oneof) | reserved                      |
    /// | tuid                     | N+K+16 | 8    | uint64       |                               |
    /// | ethereum_address_type    | N+K+24 | 2(4) | enum (oneof) | reserved                      |
    /// | ethereum_address_length  | N+K+28 | 4    | always 20    | reserved                      |
    /// | ethereum_address         | N+K+32 | 20   | bytes (20B)  |                               |
    /// | orbs_address_type        | N+K+52 | 2(4) | enum (oneof) | reserved                      |
    /// | orbs_address_length      | N+K+56 | 4    | always 20    | reserved                      |
    /// | orbs_address             | N+K+60 | 20   | bytes (20B)  | reserved                      |
    /// | tokens_type              | N+K+80 | 2(4) | enum (oneof) | reserved                      |
    /// | tokens_length            | N+K+84 | 4    | always 32    | reserved                      |
    /// | tokens                   | N+K+88 | 32   | uint256      |                               |
    /// +--------------------------+--------+------+-------------+-------------------------------+

    /// @param _eventData bytes The raw event data.
    /// @return res EventData The parsed Autonomous Swap Event Data.
    ///
    /// message Event {
    ///     primitives.contract_name contract_name = 1;
    ///     primitives.event_name event_name = 2;
    ///     bytes output_argument_array = 3; // opaque field of repeated protocol.MethodArgument
    /// }
    /// message MethodArgumentArray {
    ///     repeated MethodArgument arguments = 1;
    /// }
    /// message MethodArgument {
    ///     oneof type {
    ///         uint32 uint32_value = 1;
    ///         uint64 uint64_value = 2;
    ///         string string_value = 3;
    ///         bytes bytes_value = 4;
    ///     }
    /// }
    ///
    /// TransferredOut Event:
    ///   uint64 tuid, 
    ///   bytes[20] from_orbs_address,
    ///   byets[20] to_eth_address,
    ///   uint256 amount,
    ///

    function parseEventData(bytes _eventData) internal pure returns (EventData memory res) {
        uint offset = 0;
        uint field_offset = 0;
        uint field_length = 0;
        
        /// primitives.contract_name contract_name (string)
        (offset, field_offset, field_length) = ParseVariableSizeField(offset, _eventData, DWORD_ALIGNED);
        res.orbsContractName = string(_eventData.slice(field_offset, field_length));
 
        /// primitives.event_name event_name (string)
        (offset, field_offset, field_length) = ParseVariableSizeField(offset, _eventData, DWORD_ALIGNED);
        res.eventName = string(_eventData.slice(field_offset, field_length));

        /// output_argument_array / repeated MethodArgument arguments
        offset = offset.add(LENGTH_SIZE);

        /// argument[0] uint64 tuid
        offset = offset.add(LENGTH_SIZE);
        (offset, , ) = ParseVariableSizeField(offset, _eventData, WORD_ALIGNED); //TODO remove arg name
        offset = PraseUint16(offset, DWORD_ALIGNED); //oneof field
        res.tuid = _eventData.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        /// argument[1] bytes[20] from_orbs_address (bytes)
        offset = offset.add(LENGTH_SIZE);
        (offset, , ) = ParseVariableSizeField(offset, _eventData, WORD_ALIGNED); //TODO remove arg name
        offset = PraseUint16(offset, DWORD_ALIGNED); //oneof field
        uint32 fromAddressSize =_eventData.toUint32BE(offset);
        require(fromAddressSize == ORBS_ADDRESS_SIZE, "Invalid Orbs address size!");
        offset = offset.add(LENGTH_SIZE);
        res.from = _eventData.toBytes20(offset);
        offset = offset.add(ORBS_ADDRESS_SIZE);

        /// argument[2] bytes[20] to_eth_address (bytes)
        offset = offset.add(LENGTH_SIZE);
        (offset, , ) = ParseVariableSizeField(offset, _eventData, WORD_ALIGNED); //TODO remove arg name
        offset = PraseUint16(offset, DWORD_ALIGNED); //oneof field
        uint32 toAddressSize =_eventData.toUint32BE(offset);
        require(toAddressSize == ADDRESS_SIZE, "Invalid Ethereum address size!");
        offset = offset.add(LENGTH_SIZE);
        res.to = _eventData.toAddress(offset);
        offset = offset.add(ADDRESS_SIZE);

        /// argument[3] UINT256 ammount (bytes)
        offset = offset.add(LENGTH_SIZE);
        (offset, , ) = ParseVariableSizeField(offset, _eventData, WORD_ALIGNED); //TODO remove arg name
        offset = PraseUint16(offset, DWORD_ALIGNED); //oneof field
        res.value = _eventData.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE); // TODO change to UINT256
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
            for (uint j = 0; j < i; ++j) {
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

        // Verify message_type = Commit
        require(proof.helixMessageType == COMMIT_MESSAGE_TYPE, "invalid BlockProof, Helix message type != COMMIT");

        // Verify federation members signatures on the blockref message.
        require(isSignatureValid(proof), "Invalid signature!");
    }
}

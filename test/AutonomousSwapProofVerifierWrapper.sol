pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../contracts/AutonomousSwapProofVerifier.sol";


/// @title A wrapper around AutonomousSwapProofVerifier which implements non-Struct returning versions of some methods
/// for testing.
contract AutonomousSwapProofVerifierWrapper is AutonomousSwapProofVerifier {
    constructor(IFederation _federation) public AutonomousSwapProofVerifier(_federation) {
    }

    function processProofRaw(bytes _resultsBlockHeader, bytes _resultsBlockProof, bytes _transactionReceipt,
        bytes32[] _transactionReceiptProof) public view returns(uint32 networkType, uint64 virtualChainId,
        string orbsContractName, bytes20 from, address to, uint256 value, uint256 tuid) {
        TransferInEvent memory eventData = processProof(_resultsBlockHeader, _resultsBlockProof, _transactionReceipt,
            _transactionReceiptProof);
        networkType = eventData.networkType;
        virtualChainId = eventData.virtualChainId;
        orbsContractName = eventData.orbsContractName;
        from = eventData.from;
        to = eventData.to;
        value = eventData.value;
        tuid = eventData.tuid;
    }

    function parseResultsBlockHeaderRaw(bytes _resultsBlockHeader) public pure returns (uint32 protocolVersion,
        uint64 virtualChainId, uint32 networkType, uint64 timestamp, bytes32 transactionReceiptMerkleRoot) {
        ResultsBlockHeader memory header = parseResultsBlockHeader(_resultsBlockHeader);
        protocolVersion = header.protocolVersion;
        virtualChainId = header.virtualChainId;
        networkType = header.networkType;
        timestamp = header.timestamp;
        transactionReceiptMerkleRoot = header.transactionReceiptMerkleRoot;
    }

    function parseResultsBlockProofRaw(bytes _resultsBlockProof) public pure returns (uint32 blockProofVersion,
        bytes32 transactionsBlockHash, bytes32 blockrefHash, uint16 helixMessageType, bytes32 blockHash, uint8 numOfSignatures,
        address[MAX_SIGNATURES] memory publicAddresses, bytes[MAX_SIGNATURES] memory signatures) {
        ResultsBlockProof memory proof = parseResultsBlockProof(_resultsBlockProof);
        blockProofVersion = proof.blockProofVersion;
        transactionsBlockHash = proof.transactionsBlockHash;
        blockrefHash = proof.blockrefHash;
        helixMessageType = proof.helixMessageType;
        blockHash = proof.blockHash;
        numOfSignatures = proof.numOfSignatures;
        publicAddresses = proof.publicAddresses;
        signatures = proof.signatures;
    }

    function parseTransactionReceiptRaw(bytes _transactionReceipt) public pure returns(uint32 executionResult,
        bytes eventData) {
        TransactionReceipt memory transactionReceipt = parseTransactionReceipt(_transactionReceipt);
        executionResult = transactionReceipt.executionResult;
        eventData = transactionReceipt.eventData;
    }

    function parseEventDataRaw(bytes _eventData) public pure returns (string orbsContractName, string eventName,
        uint64 tuid, bytes20 from, address to, uint256 value) {
        EventData memory eventData = parseEventData(_eventData);
        orbsContractName = eventData.orbsContractName;
        eventName = eventData.eventName;
        tuid = eventData.tuid;
        from = eventData.from;
        to = eventData.to;
        value = eventData.value;
    }

    function parsePackedProofRaw(bytes _packedProof) public pure returns(bytes resultsBlockHeader, 
    bytes resultsBlockProof, bytes transactionReceiptProof) {
        (resultsBlockHeader, resultsBlockProof, transactionReceiptProof) = parsePackedProof(_packedProof);
    }

    function processPackedProofRaw(bytes _packedProof, bytes _transactionReceipt) public view returns(uint32 networkType, uint64 virtualChainId,
        string orbsContractName, bytes20 from, address to, uint256 value, uint256 tuid) {
        TransferInEvent memory eventData = processPackedProof(_packedProof, _transactionReceipt);
        networkType = eventData.networkType;
        virtualChainId = eventData.virtualChainId;
        orbsContractName = eventData.orbsContractName;
        from = eventData.from;
        to = eventData.to;
        value = eventData.value;
        tuid = eventData.tuid;
    }
}
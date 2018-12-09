pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;


/// @title AutonomousSwapProofVerifier interface.
/// Please note that we had to implement it as an abstract contract, rather than an interface, due to Solidity's
/// inability to contain structs in interface and it's inability to support unbound parameters (e.g., bytes) in external
/// interface methods
contract IAutonomousSwapProofVerifier {
    struct TransferInEvent {
        uint32 networkType;
        uint64 virtualChainId;
        string orbsContractName;
        bytes20 from;
        address to;
        uint256 value;
        uint256 tuid;
    }

    /// @dev Parses and validates the raw transfer proof. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _resultsBlockHeader bytes The raw Results Block Header.
    /// @param _resultsBlockProof bytes The raw Results Block Proof.
    /// @param _transactionReceipt bytes The raw Transaction Receipt.
    /// @return transferInEvent TransferInEvent The TransferIn event data.
    function processProof(bytes _resultsBlockHeader, bytes _resultsBlockProof, bytes _transactionReceipt,
        bytes32[] _transactionReceiptProof) public view returns(TransferInEvent memory transferInEvent);

    /// @dev Checks Orbs address for correctness. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _address bytes20 The Orbs address to check.
    function isOrbsAddressValid(bytes20 _address) public pure returns (bool);
}

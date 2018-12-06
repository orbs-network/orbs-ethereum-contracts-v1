pragma solidity 0.4.24;


/// @title AutonomousSwapProofVerifier interface.
interface IAutonomousSwapProofVerifier {
    /// @dev Parses and validates the raw transfer proof. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _proof bytes The raw transfer proof.
    /// @return from bytes20 from The Orbs address to transfer from.
    /// @return to address The address to transfer to.
    /// @return value uint256 The amount to be transferred.
    /// @return networkType uint32 The network ID of the Orbs network this contract is compatible for.
    /// @return virtualChainId uint64 The virtual chain ID of the underlying token on the Orbs network.
    /// @return tuid uint256 The TUID of the corresponding transaction.
    function processProof(bytes _proof) public pure returns(bytes20 from, address to, uint256 value,
        uint32 networkType, uint64 virtualChainId, uint256 tuid);

    /// @dev Checks Orbs address for correctness. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _address bytes20 The Orbs address to check.
    function isOrbsAddressValid(bytes20 _address) public pure returns (bool);
}

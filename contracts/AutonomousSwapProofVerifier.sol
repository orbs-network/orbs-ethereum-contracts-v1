pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "solidity-bytes-utils/contracts/BytesLib.sol";


/// @title ASB proof verification library
library AutonomousSwapProofVerifier {
    using SafeMath for uint256;
    using BytesLib for bytes;

    // The version of the current proof verifier library.
    string public constant VERSION = "0.1";

    /// @dev Returns the version of the current proof verifier library. Please note that this is only requires since
    /// this is a library.
    function getVersion() public pure returns(string) {
        return VERSION;
    }

    /// @dev Parses and validates the raw transfer proof.
    /// @param _proof bytes The raw transfer proof.
    /// @return from bytes20 from The Orbs address to transfer from.
    /// @return to address The address to transfer to.
    /// @return value uint256 The amount to be transferred.
    /// @return tuid uint256 The TUID of the corresponding transaction.
    function processProof(bytes _proof) public pure returns(bytes20 from, address to, uint256 value, uint256 tuid) {
        // TODO: properly process and verify the proof.
        _proof = _proof;
        from = hex"fc70f4fecdd6eced5b1b2e5c979a67cf8d272d94";
        to = 0x3e2bad0311D2718d96e86c02556886d0fdA1c208; // TBD
        value = 1000; // TBD
        tuid = 5;
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
}

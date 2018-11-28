pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";

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

    /// @dev Parses and validates the raw transfer proof.
    /// @param _proof bytes The raw transfer proof.
    /// @return from bytes20 from The Orbs address to transfer from.
    /// @return to address The address to transfer to.
    /// @return value uint256 The amount to be transferred.
    /// @return virtualChainId uint32 The virtual chain ID of the underlying token on the Orbs network.
    /// @return tuid uint256 The TUID of the corresponding transaction.
    function processProof(bytes _proof) public pure returns(bytes20 from, address to, uint256 value,
        uint32 virtualChainId, uint256 tuid) {
        // TODO: implement the finalized proof spec.

        // This is only a place-holder format:
        //   0 - 19     [20]    Orbs source address.
        //   20 - 51    [32]    Ethereum destination address.
        //   52 - 83    [32]    Amount of tokens transfer.
        //   84 - 87    [4]     Virtual chain ID.
        //   88 - 120   [32]    Orbs tuid.

        from = _proof.toBytes20(0);
        to = _proof.toAddress(20);
        value = _proof.toUint(52);
        virtualChainId = uint32(_proof.toUint(84));
        tuid = _proof.toUint(88);
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

pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";


/// @title Cryptographic utilities.
library CryptoUtils {
    uint8 public constant UNCOMPRESSED_PUBLIC_KEY_SIZE = 64;

    /// @dev Verifies ECDSA signature of a given message hash.
    /// @param _hash bytes32 The hash which is the signed message.
    /// @param _signature bytes The signature to verify.
    /// @param _address The public address of the signer (allegedly).
    function isSignatureValid(bytes32 _hash, bytes _signature, address _address) public pure returns (bool) {
        if (_address == address(0)) {
            return false;
        }

        address recovered = ECDSA.recover(_hash, _signature);
        return recovered != address(0) && recovered == _address;
    }

    /// @dev Converts a public key to an address.
    /// @param _publicKey bytes32 The uncompressed public key.
    function toAddress(bytes _publicKey) public pure returns (address) {
        if (_publicKey.length != UNCOMPRESSED_PUBLIC_KEY_SIZE) {
            return address(0);
        }

        return address(keccak256(_publicKey));
    }

    /// @dev Verifies the Merkle proof for the existence of a specific data. Please not that that this implementation
    /// assumes that each pair of leaves and each pair of pre-images are sorted (see tests for examples of
    /// construction).
    /// @param _proof bytes32[] The Merkle proof containing sibling SHA256 hashes on the branch from the leaf to the
    /// root.
    /// @param _root bytes32 The Merkle root.
    /// @param _leaf bytes The data to check.
    function isMerkleProofValid(bytes32[] _proof, bytes32 _root, bytes _leaf) public pure returns (bool) {
        return isMerkleProofValid(_proof, _root, sha256(_leaf));
    }

    /// @dev Verifies the Merkle proof for the existence of a specific data. Please not that that this implementation
    /// assumes that each pair of leaves and each pair of pre-images are sorted (see tests for examples of
    /// construction).
    /// @param _proof bytes32[] The Merkle proof containing sibling SHA256 hashes on the branch from the leaf to the
    /// root.
    /// @param _root bytes32 The Merkle root.
    /// @param _leafHash bytes32 The hash of the data to check.
    function isMerkleProofValid(bytes32[] _proof, bytes32 _root, bytes32 _leafHash) public pure returns (bool) {
        bytes32 computedHash = _leafHash;

        for (uint256 i = _proof.length; i > 0; i--) {
            bytes32 proofElement = _proof[i-1];

            if (computedHash < proofElement) {
                // Hash the current computed hash with the current element of the proof.
                computedHash = sha256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash the current element of the proof with the current computed hash.
                computedHash = sha256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // Check if the computed hash (root) is equal to the provided root.
        return computedHash == _root;
    }
}

pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";


// @title Cryptographic utilities.
library CryptoUtils {
    uint8 public constant UNCOMPRESSED_PUBLIC_KEY_SIZE = 64;

    /// @dev Verifies ECDSA signature of a given KECCAK-256 message hash.
    /// @param _hash bytes32 The KECCAK-256 hash which is the signed message.
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
}

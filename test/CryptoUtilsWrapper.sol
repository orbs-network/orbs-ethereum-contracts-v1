pragma solidity 0.4.24;

import "../contracts/CryptoUtils.sol";


/// @dev Contract wrapper around CryptoUtils. Please note that this is only required in order to support
/// solidity-coverage.
contract CryptoUtilsWrapper {
    function isSignatureValid(bytes32 _hash, bytes _signature, address _address) public pure returns (bool) {
        return CryptoUtils.isSignatureValid(_hash, _signature, _address);
    }

    function toAddress(bytes _publicKey) public pure returns (address) {
        return CryptoUtils.toAddress(_publicKey);
    }

    function isMerkleProofValid(bytes32[] _proof, bytes32 _root, bytes _leaf) public pure returns (bool) {
        return CryptoUtils.isMerkleProofValid(_proof, _root, _leaf);
    }
}

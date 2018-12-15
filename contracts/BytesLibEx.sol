pragma solidity 0.4.24;

import "solidity-bytes-utils/contracts/BytesLib.sol";


/// @title Extension to the BytesLib library.
library BytesLibEx {
    using BytesLib for bytes;

    // Data sizes (in bytes).
    uint public constant UINT16_SIZE = 2;
    uint public constant UINT32_SIZE = 4;
    uint public constant UINT64_SIZE = 8;
    uint public constant UINT256_SIZE = 32;
    uint public constant BYTES20_SIZE = 20;

    /// @dev Converts a bytes array to byte20.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toBytes20(bytes memory _bytes, uint _start) internal pure returns (bytes20) {
        require(_bytes.length >= _start + BYTES20_SIZE, "Invalid length!");

        bytes20 tempBytes20;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            tempBytes20 := mload(add(add(_bytes, 32), _start))
        }

        return tempBytes20;
    }

    /// @dev Converts a bytes array to a uint16.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint16(bytes memory _bytes, uint _start) internal pure returns (uint16) {
        return uint16(toUint(_bytes, _start, UINT16_SIZE));
    }

    /// @dev Converts a bytes array to a uint32.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint32(bytes memory _bytes, uint _start) internal pure returns (uint32) {
        return uint32(toUint(_bytes, _start, UINT32_SIZE));
    }

    /// @dev Converts a bytes array to a uint64.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint64(bytes memory _bytes, uint _start) internal pure returns (uint64) {
        return uint64(toUint(_bytes, _start, UINT64_SIZE));
    }

    /// @dev Converts a big-endian bytes array to a uint16.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint16BE(bytes memory _bytes, uint _start) internal pure returns (uint16) {
        return uint16(toUintBE(_bytes, _start, UINT16_SIZE));
    }

    /// @dev Converts a big-endian bytes array to a uint32.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint32BE(bytes memory _bytes, uint _start) internal pure returns (uint32) {
        return uint32(toUintBE(_bytes, _start, UINT32_SIZE));
    }

    /// @dev Converts a big-endian bytes array to a uint64.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint64BE(bytes memory _bytes, uint _start) internal pure returns (uint64) {
        return uint64(toUintBE(_bytes, _start, UINT64_SIZE));
    }

    /// @dev Converts a bytes array to a uint of specific size.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUintBE(bytes memory _bytes, uint _start) internal pure returns (uint) {
        return uint(toUintBE(_bytes, _start, UINT256_SIZE));
    }

    /// @dev Converts a bytes array to a uint of specific size.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint(bytes memory _bytes, uint _start, uint _size) private pure returns (uint) {
        require(_bytes.length >= _start + _size, "Invalid length!");

        uint tempUint;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            tempUint := mload(add(add(_bytes, _size), _start))
        }

        return tempUint;
    }

    /// @dev Reverses the endianness of a given byte array.
    /// @param _bytes bytes The bytes to reverse.
    function switchEndianness(bytes memory _bytes) private pure returns (bytes) {
        bytes memory newBytes = new bytes(_bytes.length);

        for (uint i = 0; i < _bytes.length; ++i) {
            newBytes[_bytes.length - i - 1] = _bytes[i];
        }

        return newBytes;
    }

    /// @dev Converts a big-endian bytes array to a uint of specific size.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUintBE(bytes memory _bytes, uint _start, uint _size) private pure returns (uint) {
        bytes memory newBytes = switchEndianness(_bytes.slice(_start, _size));
        return toUint(newBytes, 0, _size);
    }
}

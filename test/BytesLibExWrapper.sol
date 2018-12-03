pragma solidity 0.4.24;

import "../contracts/BytesLibEx.sol";


/// @dev Contract wrapper around BytesLibEx. Please note that this is only required in order to support
/// solidity-coverage.
contract BytesLibExWrapper {
    using BytesLibEx for bytes;

    function toBytes20(bytes _bytes, uint _start) public pure returns (bytes20) {
        return _bytes.toBytes20(_start);
    }

    function toUint32(bytes _bytes, uint _start) public pure returns (uint32) {
        return _bytes.toUint32(_start);
    }

    function toUint64(bytes _bytes, uint _start) public pure returns (uint64) {
        return _bytes.toUint64(_start);
    }

    function toUint32BE(bytes _bytes, uint _start) public pure returns (uint32) {
        return _bytes.toUint32BE(_start);
    }

    function toUint64BE(bytes _bytes, uint _start) public pure returns (uint64) {
        return _bytes.toUint64BE(_start);
    }
}

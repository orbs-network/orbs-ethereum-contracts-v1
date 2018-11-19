pragma solidity 0.4.24;

import "../contracts/BytesLibEx.sol";


/// @dev Contract wrapper around BytesLibEx. Please note that this is only required in order to support
/// solidity-coverage.
contract BytesLibExWrapper {
    using BytesLibEx for bytes;

    function toBytes20(bytes _bytes, uint _start) public pure returns (bytes20) {
        return _bytes.toBytes20(_start);
    }
}

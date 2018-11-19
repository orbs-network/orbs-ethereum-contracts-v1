pragma solidity 0.4.24;


// @title Extension to the BytesLib library.
library BytesLibEx {
    /// @dev Converts the bytes array to byte20.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toBytes20(bytes memory _bytes, uint _start) internal pure returns (bytes20) {
        require(_bytes.length >= (_start + 20), "Invalid length!");

        bytes20 tempBytes20;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            tempBytes20 := mload(add(add(_bytes, 0x20), _start))
        }

        return tempBytes20;
    }
}

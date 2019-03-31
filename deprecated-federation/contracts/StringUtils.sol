pragma solidity 0.4.24;


/// @title String utilities.
library StringUtils {
    /// @dev Performs an efficient string comparison (assuming keccak256 collision resistance).
    /// @param str1 The first string to compare.
    /// @param str2 The second string to compare.
    function equal(string memory str1, string memory str2) internal pure returns (bool) {
        if (bytes(str1).length != bytes(str2).length) {
            return false;
        }

        return keccak256(bytes(str1)) == keccak256(bytes(str2));
    }
}

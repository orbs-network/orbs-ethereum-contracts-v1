pragma solidity 0.4.24;

import "../contracts/StringUtils.sol";


/// @title Contract wrapper around StringUtils. Please note that this is only required in order to support
/// solidity-coverage.
contract StringUtilsWrapper {
    function equal(string memory str1, string memory str2) public pure returns (bool) {
        return StringUtils.equal(str1, str2);
    }
}

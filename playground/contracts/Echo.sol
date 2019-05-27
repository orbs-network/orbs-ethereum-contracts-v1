
pragma solidity ^0.4.24;

import "./StringUtils.sol";

contract Echo {
    using StringUtils for string;

    string public text;

    function say(string memory input) public {
        if (input.equal("foo")) {
            text = "bar";
        } else {
            text = input;
        }
    }

    function ask() public view returns (string memory said) {
        said = text;
        return said;
    }
}


pragma solidity ^0.5;

contract Echo {
    string public text;

    function say(string memory input) public {
        text = input;
    }

    function ask() public view returns (string memory said) {
        string memory said = text;
        return said;
    }
}

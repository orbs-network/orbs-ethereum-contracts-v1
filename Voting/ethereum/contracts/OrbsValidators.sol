pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

interface IOrbsValidators {
    function addValidator(address _validator) external;
    function isValidator(address m) external view returns (bool);
    function getValidators() external view returns (address[] memory);
    function leave() external returns (bool);
}

contract OrbsValidators is Ownable, IOrbsValidators {

    event ValidatorAdded(address indexed validator);
    event ValidatorLeft(address indexed validator);

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    // Maximum number of the federation members.
    uint public constant MAX_FEDERATION_MEMBERS = 100;

    address[] public members;

    function addValidator(address _validator) public onlyOwner {
        require(_validator != address(0), "Address must not be 0!");
        require(members.length <= MAX_FEDERATION_MEMBERS - 1, "Can't add more members!");

        require(!isValidator(_validator), "Address must not be already a member");

        members.push(_validator);
        emit ValidatorAdded(_validator);
    }

    function isValidator(address m) public view returns (bool) {
        for (uint i = 0; i < members.length; ++i) {
            if (members[i] == m) {
                return true;
            }
        }
        return false;
    }

    function getValidators() public view returns (address[] memory) {
        return members;
    }

    function leave() public returns (bool) {
        for (uint i = 0; i < members.length; ++i) {
            if (members[i] == msg.sender) {
                members[i] = members[members.length - 1];
                delete members[i];
                members.length--;
                emit ValidatorLeft(msg.sender);
                return true;
            }
        }
        return false;
    }
}
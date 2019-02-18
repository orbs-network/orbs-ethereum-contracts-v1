pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Federation is Ownable {

    event Log(address);

    address[] public members;

    function addMember(address newMember) onlyOwner public {
        require(newMember != address(0), "Address must not be 0!");

        require(!isMember(newMember), "Address must not be already a member");

        members.push(newMember);

        emit Log(owner());
        emit Log(msg.sender);

    }

    function isMember(address m) internal view returns (bool) {
        for (uint i = 0; i < members.length; ++i) {
            if (members[i] == m) {
                return true;
            }
        }
        return false;
    }

    function getCurrentMembers() public view returns (address[] memory) {
        return members;
    }

}
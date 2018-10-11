pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/// @title Orbs federation smart contract.
contract Federation is Ownable {
    using SafeMath for uint256;

    // The version of the current Federation smart contract.
    string public constant VERSION = "0.1";

    // Maximum number of the federation members.
    uint public constant MAX_FEDERATION_MEMBERS = 100;

    // Array of the federation members' public addresses.
    address[] public members;

    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    /// @dev Constructor that initializes the Orbs federation contract.
    /// @param _members address[] The public addresses of the federation members.
    constructor(address[] _members) public {
        require(isFedererationMembersListValid(_members), "Invalid federation members list!");

        members = _members;
    }

    /// @dev Returns the federation members. Please note that this method is only required due to the current Solidity's
    /// version inability to support accessing another contract's array using its built-in getter.
    function getMembers() public view returns (address[]) {
        return members;
    }

    /// @dev Adds new member to the federation.
    /// @param _member address The public address of the new member.
    function addMember(address _member) public onlyOwner {
        require(_member != address(0), "Address must not be 0!");
        require(members.length + 1 <= MAX_FEDERATION_MEMBERS, "Can't add more members!");

        // Check for duplicates.
        for (uint i = 0; i < members.length; ++i) {
            require(members[i] != _member, "Can't add a duplicate member!");
        }

        members.push(_member);
        emit MemberAdded(_member);
    }

    /// @dev Removes existing member from the federation.
    /// @param _member address The public address of the existing member.
    function removeMember(address _member) public onlyOwner {
        require(_member != address(0), "Address must not be 0!");
        require(members.length - 1 > 0, "Can't remove all members!");

        // Check for existence.
        (uint i, bool exists) = findMemberIndex(_member);
        require(exists, "Member doesn't exist!");

        removeMemberByIndex(i);
        emit MemberRemoved(_member);
    }

    /// @dev Returns an index of an existing member. Returns whether the member exist.
    /// @param _member address The public address of the member to look for.
    function findMemberIndex(address _member) private view returns(uint, bool) {
        uint i;
        for (i = 0; i < members.length; ++i) {
            if (members[i] == _member) {
                return (i, true);
            }
        }

        return (i, false);
    }

    /// @dev Removes a member by an index.
    /// @param _i uint The index of the member to be removed.
    function removeMemberByIndex(uint _i) private {
        while (_i < members.length - 1) {
            members[_i] = members[_i + 1];
            _i++;
        }

        members.length--;
    }

    /// @dev Checks federation members list for correctness.
    /// @param _members address[] The federation members list to check.
    function isFedererationMembersListValid(address[] _members) private pure returns (bool) {
        if (_members.length == 0 || _members.length > MAX_FEDERATION_MEMBERS) {
            return false;
        }

        // Make sure there are no zero addresses or duplicates in the federation members list.
        for (uint i = 0; i < _members.length; ++i) {
            if (_members[i] == address(0)) {
                return false;
            }

            for (uint j = i + 1; j < _members.length; ++j) {
                if (_members[i] == _members[j]) {
                    return false;
                }
            }
        }

        return true;
    }
}

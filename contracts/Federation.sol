pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/HasNoContracts.sol";
import "zeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/// @title Orbs federation smart contract.
contract Federation is HasNoContracts, HasNoTokens {
    using SafeMath for uint256;

    // The version of the current SubscriptionBilling smart contract.
    string public constant VERSION = "0.1";

    // Maximum number of federation members.
    uint public constant MAX_FEDERATION_MEMBERS = 100;

    // Array of the federations members.
    address[] public members;

    event MemberAddition(address indexed member);
    event MemberRemoval(address indexed member);

    /// @dev Constructor that initializes the Orbs federation contract.
    /// @param _members address[] The public addresses of the federation members.
    constructor(address[] _members) public {
        require(isFedererationMembersListValid(_members), "Invalid federation members list!");

        members = _members;
    }

    /// @dev Returns the array federation members. Please note that this method is only required due to the current
    //  Solidity's version inability to support accessing another contract's array using its built-in getter.
    function getMembers() public view returns (address[]) {
        return members;
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

pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./IFederation.sol";
import "./Upgradable.sol";


/// @title Orbs federation smart contract.
contract Federation is IFederation, Ownable {
    using SafeMath for uint256;

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    // Maximum number of the federation members.
    uint public constant MAX_FEDERATION_MEMBERS = 100;

    // The address of the current subscription manager.
    Upgradable public subscriptionManager;

    // Array of the federation members' public addresses.
    address[] public members;

    // The revision of the current federation (for historic queries).
    uint public federationRevision = 0;

    // A mapping of historic federation members by their revision.
    mapping(uint => address[]) public membersByRevision;

    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    /// @dev Constructor that initializes the Orbs federation contract.
    /// @param _members address[] The public addresses of the federation members.
    constructor(address[] _members) public {
        require(isFedererationMembersListValid(_members), "Invalid federation members list!");

        members = _members;
    }

    /// @dev Returns whether a specific member exists in the federation.
    /// @param _member address The public address of the member to check.
    function isMember(address _member) public view returns (bool) {
        return isMember(members, _member);
    }

    /// @dev Returns the federation members. Please note that this method is only required due to the current Solidity's
    /// version inability to support accessing another contract's array using its built-in getter.
    function getMembers() public view returns (address[]) {
        return members;
    }

    /// @dev Returns the required threshold for consensus.
    function getConsensusThreshold() public view returns (uint) {
        return getConsensusThresholdForMembers(members);
    }

    /// @dev Returns the revision of the current federation.
    function getFederationRevision() public view returns (uint) {
        return federationRevision;
    }

    /// @dev Returns whether a specific member exists in the federation by revision.
    /// @param _federationRevision uint The revision to query.
    /// @param _member address The public address of the member to check.
    function isMemberByRevision(uint _federationRevision, address _member) public view returns (bool) {
        return isMember(getMembersByRevision(_federationRevision), _member);
    }

    /// @dev Returns the federation members by revision.
    /// @param _federationRevision uint The revision to query.
    function getMembersByRevision(uint _federationRevision) public view returns (address[]) {
        return federationRevision == _federationRevision ? members : membersByRevision[_federationRevision];
    }

    /// @dev Returns the required threshold for consensus by revision.
    /// @param _federationRevision uint The revision to query.
    function getConsensusThresholdByRevision(uint _federationRevision) public view returns (uint) {
        return getConsensusThresholdForMembers(getMembersByRevision(_federationRevision));
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

        membersByRevision[federationRevision++] = members;
        members.push(_member);
        emit MemberAdded(_member);
    }

    /// @dev Removes existing member from the federation.
    /// @param _member address The public address of the existing member.
    function removeMember(address _member) public onlyOwner {
        require(_member != address(0), "Address must not be 0!");
        require(members.length - 1 > 0, "Can't remove all members!");

        // Check for existence.
        (uint i, bool exists) = findMemberIndex(members, _member);
        require(exists, "Member doesn't exist!");

        membersByRevision[federationRevision++] = members;
        removeMemberByIndex(i);
        emit MemberRemoved(_member);
    }

    /// @dev Upgrades the Subscription Manager.
    function upgradeSubscriptionManager(Upgradable _newSubscriptionManager) public onlyOwner {
        if (address(subscriptionManager) != address(0)) {
            subscriptionManager.upgrade(_newSubscriptionManager);
        }

        subscriptionManager = _newSubscriptionManager;
    }

    /// @dev Returns an index of an existing member. Returns whether the member exist.
    /// @param _members address[] The federation members list to check.
    /// @param _member address The public address of the member to look for.
    function findMemberIndex(address[] _members, address _member) private pure returns(uint, bool) {
        uint i;
        for (i = 0; i < _members.length; ++i) {
            if (_members[i] == _member) {
                return (i, true);
            }
        }

        return (i, false);
    }

    /// @dev Removes a member by an index.
    /// @param _i uint The index of the member to be removed.
    function removeMemberByIndex(uint _i) private {
        if (_i > members.length - 1 || members.length == 0) {
            return;
        }

        while (_i < members.length - 1) {
            members[_i] = members[_i + 1];
            _i++;
        }

        delete members[_i];
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

    /// @dev Returns whether a specific member exists in the federation.
    /// @param _members address[] The federation members list to check.
    /// @param _member address The public address of the member to check.
    function isMember(address[] _members, address _member) private pure returns (bool) {
        (, bool exists) = findMemberIndex(_members, _member);
        return exists;
    }

    /// @dev Returns the required threshold for consensus given a list of federation members.
    /// @param _members address[] The federation members list to check.
    function getConsensusThresholdForMembers(address[] _members) private pure returns (uint) {
        // Return 2/3 of the current federation size using the ceil(x / y) = (x + y - 1) / y round up trick.
        return (_members.length.mul(2).add(3).sub(1)).div(3);
    }
}

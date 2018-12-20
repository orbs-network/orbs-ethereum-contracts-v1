pragma solidity 0.4.24;

// File: openzeppelin-solidity/contracts/ownership/Ownable.sol

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address private _owner;

  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() internal {
    _owner = msg.sender;
    emit OwnershipTransferred(address(0), _owner);
  }

  /**
   * @return the address of the owner.
   */
  function owner() public view returns(address) {
    return _owner;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(isOwner());
    _;
  }

  /**
   * @return true if `msg.sender` is the owner of the contract.
   */
  function isOwner() public view returns(bool) {
    return msg.sender == _owner;
  }

  /**
   * @dev Allows the current owner to relinquish control of the contract.
   * @notice Renouncing to ownership will leave the contract without an owner.
   * It will not be possible to call the functions with the `onlyOwner`
   * modifier anymore.
   */
  function renounceOwnership() public onlyOwner {
    emit OwnershipTransferred(_owner, address(0));
    _owner = address(0);
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    _transferOwnership(newOwner);
  }

  /**
   * @dev Transfers control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function _transferOwnership(address newOwner) internal {
    require(newOwner != address(0));
    emit OwnershipTransferred(_owner, newOwner);
    _owner = newOwner;
  }
}

// File: openzeppelin-solidity/contracts/math/SafeMath.sol

/**
 * @title SafeMath
 * @dev Math operations with safety checks that revert on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, reverts on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b);

    return c;
  }

  /**
  * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b > 0); // Solidity only automatically asserts when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  /**
  * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a);
    uint256 c = a - b;

    return c;
  }

  /**
  * @dev Adds two numbers, reverts on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);

    return c;
  }

  /**
  * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
  * reverts when dividing by zero.
  */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0);
    return a % b;
  }
}

// File: contracts/IFederation.sol

/// @title Federation interface.
interface IFederation {
    /// @dev Returns whether a specific member exists in the federation.
    /// @param _member address The public address of the member to check.
    function isMember(address _member) external view returns (bool);

    /// @dev Returns the federation members.
    function getMembers() external view returns (address[]);

    /// @dev Returns the required threshold for consensus.
    function getConsensusThreshold() external view returns (uint);

    /// @dev Returns the revision of the current federation.
    function getFederationRevision() external view returns (uint);

    /// @dev Returns whether a specific member exists in the federation by revision.
    /// @param _federationRevision uint The revision to query.
    /// @param _member address The public address of the member to check.
    function isMemberByRevision(uint _federationRevision, address _member) external view returns (bool);

    /// @dev Returns the federation members by revision.
    /// @param _federationRevision uint The revision to query.
    function getMembersByRevision(uint _federationRevision) external view returns (address[]);

    /// @dev Returns the required threshold for consensus by revision.
    /// @param _federationRevision uint The revision to query.
    function getConsensusThresholdByRevision(uint _federationRevision) external view returns (uint);
}

// File: contracts/Upgradable.sol

/// @title Upgradable smart contract pattern.
contract Upgradable is Ownable {
    /// @dev Upgrade flow: triggers the upgrade callback of the old contract.
    /// @param _newContract address The address of the new contract which going to replace this one.
    function upgrade(Upgradable _newContract) public onlyOwner {
        require(address(_newContract) != address(0), "Address must not be 0!");
        require(address(_newContract) != address(this), "Can't upgrade to the same contract!");
        require(_newContract.owner() == owner(), "The old and the new contracts should share the same owners!");

        require(onUpgrade(_newContract), "Upgrade has failed!");
    }

    /// @dev A callback which will be called during an upgrade and will return the status of the of upgrade.
    function onUpgrade(Upgradable _newContract) internal returns (bool);
}

// File: contracts/Federation.sol

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

    /// @dev Removes a member by an index.
    /// @param _i uint The index of the member to be removed.
    function removeMemberByIndex(uint _i) public {
        require(_i < members.length, "Index out of range!");

        while (_i < members.length - 1) {
            members[_i] = members[_i + 1];
            _i++;
        }

        delete members[_i];
        members.length--;
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

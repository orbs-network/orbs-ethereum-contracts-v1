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

// File: openzeppelin-solidity/contracts/token/ERC20/IERC20.sol

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface IERC20 {
  function totalSupply() external view returns (uint256);

  function balanceOf(address who) external view returns (uint256);

  function allowance(address owner, address spender)
    external view returns (uint256);

  function transfer(address to, uint256 value) external returns (bool);

  function approve(address spender, uint256 value)
    external returns (bool);

  function transferFrom(address from, address to, uint256 value)
    external returns (bool);

  event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
  );

  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 value
  );
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

// File: contracts/IAutonomousSwapProofVerifier.sol

pragma experimental ABIEncoderV2;


/// @title AutonomousSwapProofVerifier interface.
/// Please note that we had to implement it as an abstract contract, rather than an interface, due to Solidity's
/// inability to contain structs in interface and it's inability to support unbound parameters (e.g., bytes) in external
/// interface methods
contract IAutonomousSwapProofVerifier {
    struct TransferInEvent {
        uint32 networkType;
        uint64 virtualChainId;
        string orbsContractName;
        bytes20 from;
        address to;
        uint256 value;
        uint256 tuid;
    }

    /// @dev Parses and validates the raw transfer proof. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _resultsBlockHeader bytes The raw Results Block Header.
    /// @param _resultsBlockProof bytes The raw Results Block Proof.
    /// @param _transactionReceipt bytes The raw Transaction Receipt.
    /// @return transferInEvent TransferInEvent The TransferIn event data.
    function processProof(bytes _resultsBlockHeader, bytes _resultsBlockProof, bytes _transactionReceipt,
        bytes32[] _transactionReceiptProof) public view returns(TransferInEvent memory transferInEvent);

    /// @dev Checks Orbs address for correctness. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _address bytes20 The Orbs address to check.
    function isOrbsAddressValid(bytes20 _address) public pure returns (bool);
}

// File: contracts/StringUtils.sol

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

// File: contracts/AutonomousSwapBridge.sol










/// @title Autonomous Swap Bridge (ASB) smart contract.
contract AutonomousSwapBridge is Ownable {
    using SafeMath for uint256;
    using StringUtils for string;

    // The version of the current ASB smart contract.
    uint public constant VERSION = 1;

    // The network type of the Orbs network this contract is compatible for.
    uint32 public networkType;

    // The virtual chain ID of the underlying token on the Orbs network.
    uint64 public virtualChainId;

    // The name of the Orbs Autonomous Swap Bridge (ASB) smart contract (used during proof verification).
    string public orbsASBContractName;

    // The swappable ERC20 token.
    IERC20 public token;

    // The federation smart contract.
    IFederation public federation;

    // The ASB proof verifier.
    IAutonomousSwapProofVerifier public verifier;

    // Incremental counter for Transaction Unique Identifiers (TUID).
    uint256 public tuidCounter = 0;

    // Mapping of spent Orbs TUIDs.
    mapping(uint256 => bool) public spentOrbsTuids;

    event TransferredOut(uint256 indexed tuid, address indexed from, bytes20 indexed to, uint256 value);
    event TransferredIn(uint256 indexed tuid, bytes20 indexed from, address indexed to, uint256 value);

    /// @dev Constructor that initializes the ASB contract.
    /// @param _networkType uint32 The network type of the Orbs network this contract is compatible for.
    /// @param _virtualChainId uint64 The virtual chain ID of the underlying token on the Orbs network.
    /// @param _orbsASBContractName string The address of the Federation contract.
    /// @param _token IERC20 The swappable ERC20 token.
    /// @param _federation IFederation The federation smart contract.
    /// @param _verifier IAutonomousSwapProofVerifier The ASB proof verifier.
    constructor(uint32 _networkType, uint64 _virtualChainId, string _orbsASBContractName, IERC20 _token,
        IFederation _federation, IAutonomousSwapProofVerifier _verifier) public {
        require(bytes(_orbsASBContractName).length > 0, "Orbs ASB contract name must not be empty!");
        require(address(_token) != address(0), "Token must not be 0!");
        require(address(_federation) != address(0), "Federation must not be 0!");

        setAutonomousSwapProofVerifier(_verifier);

        networkType = _networkType;
        virtualChainId = _virtualChainId;
        orbsASBContractName = _orbsASBContractName;
        token = _token;
        federation = _federation;
    }

    /// @dev Transfer tokens to Orbs. The method retrieves and locks the tokens and emits the TransferredOut event.
    /// @param _to bytes20 The Orbs address to transfer to.
    /// @param _value uint256 The amount to be transferred.
    function transferOut(bytes20 _to, uint256 _value) public {
        require(verifier.isOrbsAddressValid(_to), "Orbs address is invalid!");
        require(_value > 0, "Value must be greater than 0!");

        // Verify that the requested approved enough tokens to transfer out.
        require(token.transferFrom(msg.sender, address(this), _value), "Insufficient allowance!");

        // Get a fresh TUID. Please note that a uint256 overflow isn't a concern here, since it can only happen after
        // 2^256 transactions (in which case, it will be no longer possible to issue transfers using this specific
        // instance of the ASB smart contract).
        tuidCounter = tuidCounter.add(1);

        emit TransferredOut(tuidCounter, msg.sender, _to, _value);
    }

    /// @dev Transfer tokens from Orbs.
    /// @param _resultsBlockHeader bytes The raw Results Block Header.
    /// @param _resultsBlockProof bytes The raw Results Block Proof.
    /// @param _transactionReceipt bytes The raw Transaction Receipt.
    function transferIn(bytes _resultsBlockHeader, bytes _resultsBlockProof, bytes _transactionReceipt,
        bytes32[] _transactionReceiptProof) public {
        IAutonomousSwapProofVerifier.TransferInEvent memory eventData = verifier.processProof(_resultsBlockHeader,
            _resultsBlockProof, _transactionReceipt, _transactionReceiptProof);

        require(eventData.to != address(0), "Destination address can't be 0!");
        require(eventData.value > 0, "Value must be greater than 0!");

        // Verify network and protocol parameters.
        require(networkType == eventData.networkType, "Incorrect network type!");
        require(virtualChainId == eventData.virtualChainId, "Incorrect virtual chain ID!");
        require(orbsASBContractName.equal(eventData.orbsContractName), "Incorrect Orbs ASB contract name!");

        // Make sure that the transaction wasn't already spent and mark it as such;
        require(!spentOrbsTuids[eventData.tuid], "TUID was already spent!");
        spentOrbsTuids[eventData.tuid] = true;

        // Transfer the token.
        require(token.transfer(eventData.to, eventData.value), "Insufficient funds!");

        emit TransferredIn(eventData.tuid, eventData.from, eventData.to, eventData.value);
    }

    /// @dev Allows the owner to upgrade its ASB proof verifier.
    /// @param _verifier IAutonomousSwapProofVerifier new verifier.
    function setAutonomousSwapProofVerifier(IAutonomousSwapProofVerifier _verifier) public onlyOwner {
        require(address(_verifier) != address(0), "Verifier must not be 0!");

        verifier = _verifier;
    }
}

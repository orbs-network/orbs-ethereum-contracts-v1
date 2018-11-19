pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./IFederation.sol";
import "./AutonomousSwapProofVerifier.sol";


/// @title Autonomous Swap Bridge (ASB) smart contract.
contract AutonomousSwapBridge {
    using SafeMath for uint256;

    // The version of the current ASB smart contract.
    string public constant VERSION = "0.1";

    // The virtual chain ID of the underlying token on the Orbs network.
    uint32 public virtualChainId;

    // The name of the Orbs Autonomous Swap Bridge (ASB) smart contract (used during proof verification).
    string public orbsASBContractName;

    // The swappable ERC20 token.
    IERC20 public token;

    // The federation smart contract.
    IFederation public federation;

    // Incremental counter for Transaction Unique Identifiers (TUID).
    uint256 public tuidCounter = 0;

    // Mapping of spent Orbs TUIDs.
    mapping(uint256 => bool) public spentOrbsTuids;

    event TransferredOut(uint256 indexed tuid, address indexed from, bytes20 indexed to, uint256 value);
    event TransferredIn(uint256 indexed tuid, bytes20 indexed from, address indexed to, uint256 value);

    /// @dev Constructor that initializes the ASB contract.
    /// @param _virtualChainId uint32 The virtual chain ID of the underlying token on the Orbs network.
    /// @param _orbsASBContractName string The address of the Federation contract.
    /// @param _token IERC20 The swappable ERC20 token.
    constructor(uint32 _virtualChainId, string _orbsASBContractName, IERC20 _token, IFederation _federation) public {
        require(bytes(_orbsASBContractName).length > 0, "Orbs ASB contract name must not be empty!");
        require(address(_token) != address(0), "Token must not be 0!");
        require(address(_federation) != address(0), "Federation must not be 0!");

        virtualChainId = _virtualChainId;
        orbsASBContractName = _orbsASBContractName;
        token = _token;
        federation = _federation;
    }

    /// @dev Transfer tokens to Orbs. The method retrieves and locks the tokens and emits the TransferredOut event.
    /// @param _to bytes20 The Orbs address to transfer to.
    /// @param _value uint256 The amount to be transferred.
    function transferOut(bytes20 _to, uint256 _value) public {
        require(AutonomousSwapProofVerifier.isOrbsAddressValid(_to), "Orbs address is invalid!");
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
    /// @param _proof bytes TransferIn proof.
    function transferIn(bytes _proof) public {
        (bytes20 from, address to, uint256 value, uint256 tuid) = AutonomousSwapProofVerifier.processProof(_proof);

        require(to != address(0), "Destination address can't be 0!");
        require(value > 0, "Value must be greater than 0!");

        // Make sure that the transaction wasn't already spent and mark it as such;
        require(!spentOrbsTuids[tuid], "TUID was already spent!");
        spentOrbsTuids[tuid] = true;

        // Transfer the token.
        require(token.transfer(to, value), "Insufficient funds!");

        emit TransferredIn(tuid, from, to, value);
    }
}

pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./IFederation.sol";


/// @title Autonomous Swap Bridge (ASB) smart contract.
contract AutonomousSwapBridge {
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
}

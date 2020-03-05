pragma solidity 0.5.16;

import "./IRewards.sol";

/// @title Subscriptions contract interface
interface ISubscriptions {
    event SubscriptionChanged(uint256 vcid, uint256 genRef, uint256 expiresAt, string tier);
    event Payment(uint256 vcid, address by, uint256 amount, string tier, uint256 rate);
    event VcConfigRecordChanged(uint256 vcid, string key, string value);
    event SubscriberAdded(address subscriber);

    /*
     *   Methods restricted to other Orbs contracts
     */

    /// @dev Called by: authorized subscriber (plan) contracts
    /// Creates a new VC
    function createVC(string calldata tier, uint256 rate, uint256 amount, address owner) external returns (uint, uint);

    /// @dev Called by: authorized subscriber (plan) contracts
    /// Extends the subscription of an existing VC.
    function extendSubscription(uint256 vcid, uint256 amount, address payer) external;

    /// @dev called by VC owner to set a VC config record. Emits a VcConfigRecordChanged event.
    function setVcConfigRecord(uint256 vcid, string calldata key, string calldata value) external;

    /*
     *   Governance methods
     */

    /// @dev Called by the owner to authorize a subscriber (plan)
    function addSubscriber(address addr) external /* onlyOwner */;

    /// @dev Updates the address of the contract registry
    function setContractRegistry(IContractRegistry _contractRegistry) external /* onlyOwner */;

}

pragma solidity 0.4.26;

import "./IRewards.sol";

/// @title Subscriptions contract interface
interface ISubscriptions {
    event SubscriptionChanged(uint256 vcid, uint256 genRef, uint256 expiresAt, string tier);
    event Payment(uint256 vcid, address by, uint256 amount, string tier, uint256 rate);
    event SubscriberAdded(address subscriber);

    /*
     *   Methods restricted to other Orbs contracts
     */

    /// @dev Called by: authorized subscriber (plan) contracts
    /// Creates a new VC
    function createVC(string tier, uint256 rate, uint256 amount, address owner) external returns (uint, uint);

    /// @dev Called by: authorized subscriber (plan) contracts
    /// Extends the subscription of an existing VC.
    function extendSubscription(uint256 vcid, uint256 amount, address payer) external;

    /*
     *   Owner methods
     */

    /// @dev Called by the owner to authorize a subscriber (plan)
    function addSubscriber(address addr) external /* onlyOwner */;

}

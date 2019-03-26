pragma solidity 0.4.25;

import "orbs-voting/contracts/IOrbsValidators.sol";
import "../contracts/OrbsSubscriptions.sol";

contract OrbsSubscriptionsMock is OrbsSubscriptions {
    struct UpgradeContext {
        bool called;
        address newContract;
        bool shouldFailGracefully;
        bool shouldRevert;
    }

    UpgradeContext public upgradeContext;

    constructor(IERC20 _orbs, IOrbsValidators _orbsValidators, uint256 _minimalMonthlySubscription) public
        OrbsSubscriptions(_orbs, _orbsValidators, _minimalMonthlySubscription) {
    }

    function getTotalMonthlySubscriptionsTokens(uint16 _year, uint8 _month) public view returns (uint256) {
        return subscriptions[_year][_month].totalTokens;
    }

    function distributeFeesByTime(uint16 _year, uint8 _month) public {
        super.distributeFees(_year, _month);
    }

    function subscribeByTime(bytes32 _id, string memory _profile, uint256 _value, uint256 _startTime) public {
        super.subscribe(_id, _profile, _value, _startTime);
    }

    /// @dev Sets the expectation of the smart contract's upgrade to fail either in a graceful way (by returning false
    /// from its callback) or by triggering a revert.
    function setUpgradeFail(bool _gracefully) public {
        upgradeContext.shouldFailGracefully = _gracefully;
        upgradeContext.shouldRevert = !_gracefully;
    }
}

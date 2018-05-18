pragma solidity 0.4.23;

import "../contracts/SubscriptionBilling.sol";


contract SubscriptionBillingMock is SubscriptionBilling {
    constructor(ERC20 _orbs, address[] _federationMembers,
        uint256 _minimalMonthlySubscription) public SubscriptionBilling(_orbs, _federationMembers,
        _minimalMonthlySubscription) {
    }

    function getFederationMembers() public view returns (address[]) {
        return federationMembers;
    }

    function getTotalMonthlySubscriptionsTokens(uint16 _year, uint8 _month) public view returns (uint256) {
        return subscriptions[_year][_month].totalTokens;
    }

    function distributeFeesByTime(uint16 _year, uint8 _month) public {
        super.distributeFees(_year, _month);
    }

    function subscribeByTime(bytes32 _id, string _profile, uint256 _value, uint256 _startTime) public {
        super.subscribe(_id, _profile, _value, _startTime);
    }
}

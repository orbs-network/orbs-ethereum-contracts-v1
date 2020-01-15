pragma solidity 0.4.26;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Subscriptions.sol";

contract MonthlySubscriptionPlan {

    Subscriptions subs;
    string public tier;
    uint256 public monthlyRate;

    constructor(Subscriptions _subs, string _tier, uint256 _monthlyRate) public {
        require(bytes(_tier).length > 0, "must specify a valid tier label");

        tier = _tier;
        subs = _subs;
        monthlyRate = _monthlyRate;
    }

    function createVC(uint256 amount) public {
        require(amount > 0, "must include funds");
        subs.createVC(tier, monthlyRate, amount, msg.sender);
    }

    function extendSubscription(uint256 vcid, uint256 amount) public {
        require(amount > 0, "must include funds");
        subs.payForVC(vcid, tier, monthlyRate, amount, msg.sender);
    }
}
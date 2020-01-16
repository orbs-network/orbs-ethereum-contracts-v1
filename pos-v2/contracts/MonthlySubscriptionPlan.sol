pragma solidity 0.4.26;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./Subscriptions.sol";

contract MonthlySubscriptionPlan {

    Subscriptions subs;
    string public tier;
    uint256 public monthlyRate;

    IERC20 erc20;

    constructor(Subscriptions _subs, IERC20 _erc20, string _tier, uint256 _monthlyRate) public {
        require(bytes(_tier).length > 0, "must specify a valid tier label");

        tier = _tier;
        subs = _subs;
        erc20 = _erc20;
        monthlyRate = _monthlyRate;
    }

    function createVC(uint256 amount) public {
        require(amount > 0, "must include funds");

        // TODO TBD subs has to trust this contract to transfer the funds. alternatively, transfer to this account and then approve subs to pull same amount.
        require(erc20.transferFrom(msg.sender, subs, amount), "failed to transfer subscription fees");

        subs.createVC(tier, monthlyRate, amount, msg.sender);
    }

    function extendSubscription(uint256 vcid, uint256 amount) public {
        require(amount > 0, "must include funds");

        // TODO TBD subs has to trust this contract to transfer the funds. alternatively, transfer to this account and then approve subs to pull same amount.
        require(erc20.transferFrom(msg.sender, subs, amount), "failed to transfer subscription fees");

        subs.extendSubscription(vcid, amount, msg.sender);
    }
}

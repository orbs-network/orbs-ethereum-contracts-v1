pragma solidity 0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./Subscriptions.sol";
import "./ContractRegistry.sol";

contract MonthlySubscriptionPlan is Ownable {

    IContractRegistry contractRegistry;

    string public tier;
    uint256 public monthlyRate;

    IERC20 erc20;

    constructor(IERC20 _erc20, string memory _tier, uint256 _monthlyRate) public {
        require(bytes(_tier).length > 0, "must specify a valid tier label");

        tier = _tier;
        erc20 = _erc20;
        monthlyRate = _monthlyRate;
    }

    function setContractRegistry(IContractRegistry _contractRegistry) external onlyOwner {
        require(address(_contractRegistry) != address(0), "contractRegistry must not be 0");
        contractRegistry = _contractRegistry;
    }

    function createVC(uint256 amount, string calldata deploymentSubset) external {
        require(amount > 0, "must include funds");

        ISubscriptions subs = ISubscriptions(contractRegistry.get("subscriptions"));

        // TODO TBD subs has to trust this contract to transfer the funds. alternatively, transfer to this account and then approve subs to pull same amount.
        require(erc20.transferFrom(msg.sender, address(subs), amount), "failed to transfer subscription fees");
        subs.createVC(tier, monthlyRate, amount, msg.sender, deploymentSubset);
    }

    function extendSubscription(uint256 vcid, uint256 amount) external {
        require(amount > 0, "must include funds");

        ISubscriptions subs = ISubscriptions(contractRegistry.get("subscriptions"));

        // TODO TBD subs has to trust this contract to transfer the funds. alternatively, transfer to this account and then approve subs to pull same amount.
        require(erc20.transferFrom(msg.sender, address(subs), amount), "failed to transfer subscription fees");
        subs.extendSubscription(vcid, amount, msg.sender);
    }
}

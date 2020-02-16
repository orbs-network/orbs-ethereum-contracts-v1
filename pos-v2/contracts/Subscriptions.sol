pragma solidity 0.4.26;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/ISubscriptions.sol";
import "./interfaces/IRewards.sol";

contract Subscriptions is ISubscriptions, Ownable{
    using SafeMath for uint256;

    event SubscriptionChanged(uint256 vcid, uint256 genRef, uint256 expiresAt, string tier);
    event Payment(uint256 vcid, address by, uint256 amount, string tier, uint256 rate);
    event VcConfigRecordChanged(uint256 vcid, string key, string value);
    event SubscriberAdded(address subscriber);

    struct VirtualChain {
        string tier;
        uint256 rate;
        uint expiresAt;
        uint genRef;
        address owner;
    }

    mapping (address => bool) authorizedSubscribers;
    mapping (uint => VirtualChain) virtualChains;

    uint nextVcid;

    IRewards rewardsContract;
    IERC20 erc20;

    constructor (IRewards _rewardsContract, IERC20 _erc20) public {
        require(_rewardsContract != address(0), "rewardsContract should not be 0");
        nextVcid = 1000000;
        rewardsContract = _rewardsContract;
        erc20 = _erc20;
    }

    function setVcConfigRecord(uint256 vcid, string key, string value) external {
        require(msg.sender == virtualChains[vcid].owner, "only vc owner can set a vc config record");

        emit VcConfigRecordChanged(vcid, key, value);
    }

    function addSubscriber(address addr) external onlyOwner {
        require(addr != address(0), "must provide a valid address");

        authorizedSubscribers[addr] = true;
    }

    function createVC(string tier, uint256 rate, uint256 amount, address owner) external returns (uint, uint) {
        require(authorizedSubscribers[msg.sender], "must be an authorized subscriber");

        uint vcid = nextVcid++;
        VirtualChain memory vc = VirtualChain({
            expiresAt: block.timestamp,
            genRef: block.number + 300,
            owner: owner,
            tier: tier,
            rate: rate
        });
        virtualChains[vcid] = vc;

        _extendSubscription(vcid, amount, owner);
        return (vcid, vc.genRef);
    }

    function extendSubscription(uint256 vcid, uint256 amount, address payer) external {
        _extendSubscription(vcid, amount, payer);
    }

    function _extendSubscription(uint256 vcid, uint256 amount, address payer) private {
        VirtualChain storage vc = virtualChains[vcid];
        vc.expiresAt = vc.expiresAt.add(amount.mul(30 days).div(vc.rate));

        require(erc20.transfer(rewardsContract, amount), "failed to transfer subscription fees");
        rewardsContract.fillFeeBuckets(amount, vc.rate);

        emit SubscriptionChanged(vcid, vc.genRef, vc.expiresAt, vc.tier);
        emit Payment(vcid, payer, amount, vc.tier, vc.rate);
    }

}

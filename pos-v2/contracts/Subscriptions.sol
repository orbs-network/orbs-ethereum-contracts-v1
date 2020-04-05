pragma solidity 0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "./interfaces/ISubscriptions.sol";
import "./interfaces/IRewards.sol";
import "./interfaces/IContractRegistry.sol";

contract Subscriptions is ISubscriptions, Ownable{
    using SafeMath for uint256;

    IContractRegistry contractRegistry;

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

    IERC20 erc20;

    constructor (IERC20 _erc20) public {
        require(address(_erc20) != address(0), "erc20 must not be 0");

        nextVcid = 1000000;
        erc20 = _erc20;
    }

    function setContractRegistry(IContractRegistry _contractRegistry) external onlyOwner {
        require(address(_contractRegistry) != address(0), "contractRegistry must not be 0");
        contractRegistry = _contractRegistry;
    }

    function setVcConfigRecord(uint256 vcid, string calldata key, string calldata value) external {
        require(msg.sender == virtualChains[vcid].owner, "only vc owner can set a vc config record");

        emit VcConfigRecordChanged(vcid, key, value);
    }

    function addSubscriber(address addr) external onlyOwner {
        require(addr != address(0), "must provide a valid address");

        authorizedSubscribers[addr] = true;
    }

    function createVC(string calldata tier, uint256 rate, uint256 amount, address owner) external returns (uint, uint) {
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

        IRewards rewardsContract = IRewards(contractRegistry.get("rewards"));
        require(erc20.transfer(address(rewardsContract), amount), "failed to transfer subscription fees");
        rewardsContract.fillFeeBuckets(amount, vc.rate);

        emit SubscriptionChanged(vcid, vc.genRef, vc.expiresAt, vc.tier);
        emit Payment(vcid, payer, amount, vc.tier, vc.rate);
    }

}

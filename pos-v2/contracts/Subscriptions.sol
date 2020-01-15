pragma solidity 0.4.26;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Subscriptions is Ownable {
    using SafeMath for uint256;

    event SubscriptionChanged(uint256 vcid, uint256 genRef, uint256 expiresAt, string tier);
    event Payment(uint256 vcid, address by, uint256 amount, string tier, uint256 rate);

    event SubscriberAdded(address subscriber);

    struct VirtualChain {
        uint expiresAt;
        uint genRef;
        address owner;
    }

    mapping (address => bool) authorizedSubscribers;
    mapping (uint => VirtualChain) virtualChains;

    uint nextVcid;

    constructor () public {
        nextVcid = 1000000;
    }

    function addSubscriber(address addr) public onlyOwner {
        require(addr != address(0), "must provide a valid address");

        authorizedSubscribers[addr] = true;
    }

    function createVC(string tier, uint256 rate, uint256 amount, address owner) public returns (uint, uint) {
        require(authorizedSubscribers[msg.sender], "must be an authorized subscriber");

        uint vcid = nextVcid++;
        VirtualChain storage vc = virtualChains[vcid];

        vc.expiresAt =  block.timestamp;
        vc.genRef = block.number + 300;
        vc.owner = owner;

        return payForVC(vcid, tier, rate, amount, owner);
    }

    function payForVC(uint256 vcid, string tier, uint256 rate, uint256 amount, address payer) public returns (uint, uint) {
        VirtualChain storage vc = virtualChains[vcid];
        vc.expiresAt = vc.expiresAt.add(amount.mul(30 days).div(rate));

        emit SubscriptionChanged(vcid, vc.genRef, vc.expiresAt, tier);
        emit Payment(vcid, payer, amount, tier, rate);
        return (vcid, vc.genRef);
    }
}
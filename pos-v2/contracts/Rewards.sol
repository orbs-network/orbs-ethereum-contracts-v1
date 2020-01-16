pragma solidity 0.4.26;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";

import "./IStakingContract.sol";
import "./ICommitteeListener.sol";

contract Rewards is ICommitteeListener, Ownable {
    using SafeMath for uint256;

    event RewardAssigned(address assignee, uint256 amount, uint256 balance);
    event FeeAddedToBucket(uint256 bucketId, uint256 added, uint256 total);

    uint256 constant bucketTimePeriod = 30 days;

    uint256 feePool;
    mapping(uint256 => uint256) feeBuckets;
    uint256 lastPayedAt;

    mapping(address => uint256) balance;

    IStakingContract stakingContract;
    IERC20 erc20;
    address committeeProvider;

    uint256 constant MAX_WEIGHT = 10000000000000000000; // small enough to multiply by total token supply without overflow

    struct CommitteeMember {
        address addr;
        uint weight; // on a scale from 0 to MAX_WEIGHT
    }

    CommitteeMember[] currentCommittee;


    modifier onlyCommitteeProvider() {
        require(msg.sender == committeeProvider, "caller is not the committee provider");

        _;
    }

    constructor(IERC20 _erc20) public {
        require(_erc20 != address(0), "erc20 must not be 0");
        erc20 = _erc20;
        lastPayedAt = now;
    }

    function getBalance(address addr) public view returns (uint256) {
        return balance[addr];
    }

    function getLastPayedAt() public view returns (uint256) {
        return lastPayedAt;
    }

    function setCommitteeProvider(address _committeeProvider) external onlyOwner {
        committeeProvider = _committeeProvider;
    }

    function setStakingContract(IStakingContract _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "staking contract must not be 0");
        stakingContract = _stakingContract;
    }

    function committeeChanged(address[] addrs, uint256[] stakes) external onlyCommitteeProvider {
        require(addrs.length == stakes.length, "expected addrs and stakes to be of same length");

        assignRewards(); // We want the previous committee to take the rewards

        uint256 totalStake = 0;
        for (uint i = 0; i < stakes.length; i++) {
            totalStake += stakes[i];
        }

        currentCommittee.length = addrs.length;
        for (i = 0; i < addrs.length; i++) {
            uint weight = 0;
            if (totalStake > 0) {
                weight = MAX_WEIGHT.mul(stakes[i]).div(totalStake);
            }
            currentCommittee[i] = CommitteeMember({
                addr: addrs[i],
                weight:  weight
            });
        }
    }

    uint constant MAX_REWARD_BUCKET_ITERATIONS = 6;

    function assignRewards() public returns (uint256) {
        uint bucketsPayed = 0;
        while (bucketsPayed < MAX_REWARD_BUCKET_ITERATIONS && lastPayedAt < now) {
            uint256 bucketStart = _bucketTime(lastPayedAt);
            uint256 bucketEnd = bucketStart.add(bucketTimePeriod);
            uint256 payUntil = Math.min(bucketEnd, now);
            uint256 duration = payUntil.sub(lastPayedAt);
            uint256 remainingBucketTime = bucketEnd.sub(lastPayedAt);
            uint256 amount = feeBuckets[bucketStart] * duration / remainingBucketTime;

            assignAmountToCommitteeMembers(amount);
            feeBuckets[bucketStart] = feeBuckets[bucketStart].sub(amount);
            lastPayedAt = payUntil;

            assert(lastPayedAt <= bucketEnd);
            if (lastPayedAt == bucketEnd) {
                delete feeBuckets[bucketStart];
            }

            bucketsPayed++;
        }

        return lastPayedAt;
    }

    function assignAmountToCommitteeMembers(uint256 amount) private {
        uint256 totalAssigned = 0;
        for (uint i = 0; i < currentCommittee.length; i++) {
            uint256 curAmount = amount.mul(currentCommittee[i].weight).div(MAX_WEIGHT);
            address curAddr = currentCommittee[i].addr;
            balance[curAddr] = balance[curAddr].add(curAmount);
            emit RewardAssigned(curAddr, curAmount, balance[curAddr]);
            totalAssigned = totalAssigned.add(curAmount);
        }

        // assign remainder to a random committee member
        uint256 roundingRemainder = amount.sub(totalAssigned);
        if (roundingRemainder > 0 && currentCommittee.length > 0) {
            address addr = currentCommittee[now % currentCommittee.length].addr;
            balance[addr] = balance[addr].add(roundingRemainder);
            emit RewardAssigned(addr, roundingRemainder, balance[addr]);
        }
    }

    function fillFeeBuckets(uint256 amount, uint256 monthlyRate) public {
        assignRewards(); // to handle rate change in the middle of a bucket time period (TBD - this is nice to have, consider removing)

        uint256 bucket = _bucketTime(now);

        // add the partial amount to the first bucket
        uint256 bucketAmount = Math.min(amount, monthlyRate.mul(bucketTimePeriod - now % bucketTimePeriod).div(bucketTimePeriod));
        feeBuckets[bucket] = feeBuckets[bucket].add(bucketAmount);
        amount = amount.sub(bucketAmount);
        emit FeeAddedToBucket(bucket, bucketAmount, feeBuckets[bucket]);

        // following buckets are added with the monthly rate
        while (amount > 0) {
            bucket = bucket.add(bucketTimePeriod);
            bucketAmount = Math.min(monthlyRate, amount);
            feeBuckets[bucket] = feeBuckets[bucket].add(bucketAmount);
            amount = amount.sub(bucketAmount);
            emit FeeAddedToBucket(bucket, bucketAmount, feeBuckets[bucket]);
        }

        assert(amount == 0);
    }

    function distributeRewards(address[] to, uint256[] amounts) public {
        require(to.length == amounts.length, "expected to and amounts to be of same length");

        uint256 totalAmount = 0;
        for (uint i = 0; i < to.length; i++) {
            totalAmount = totalAmount.add(amounts[i]);
        }
        require(totalAmount <= balance[msg.sender], "not enough balance for this distribution");
        balance[msg.sender] = balance[msg.sender].sub(totalAmount);

        erc20.approve(stakingContract, totalAmount);
        stakingContract.distributeRewards(totalAmount, to, amounts);
    }

    function _bucketTime(uint256 time) private pure returns (uint256) {
        return time - time % bucketTimePeriod;
    }

}

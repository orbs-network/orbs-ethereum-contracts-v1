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

    mapping(uint256 => uint256) feePoolBuckets;
    uint256 fixedPool;
    uint256 fixedPoolMonthlyRate; // TODO - should the fixed pool rate be a function of the committee size?
    uint256 proRataPool;
    uint256 proRataPoolMonthlyRate;

    uint256 lastPayedAt;

    mapping(address => uint256) orbsBalance;
    mapping(address => uint256) externalTokenBalance;

    IStakingContract stakingContract;
    IERC20 erc20;
    IERC20 externalToken;
    address committeeProvider;
    address rewardsGovernor;

    struct CommitteeMember {
        address addr;
        uint256 stake;
    }
    enum TokenType {
        Orbs,
        ExternalToken
    }
    uint256 currentTotalStake;
    CommitteeMember[] currentCommittee;

    modifier onlyCommitteeProvider() {
        require(msg.sender == committeeProvider, "caller is not the committee provider");

        _;
    }

    modifier onlyRewardsGovernor() {
        require(msg.sender == rewardsGovernor, "caller is not the rewards governor");

        _;
    }

    constructor(IERC20 _erc20, IERC20 _externalToken, address _rewardsGovernor) public {
        require(_erc20 != address(0), "erc20 must not be 0");
        require(_externalToken != address(0), "externalToken must not be 0");

        erc20 = _erc20;
        externalToken = _externalToken;
        lastPayedAt = now;
        rewardsGovernor = _rewardsGovernor;
    }

    function setFixedPoolMonthlyRate(uint256 rate) external onlyRewardsGovernor {
        assignRewards();
        fixedPoolMonthlyRate = rate;
    }

    function setProRataPoolMonthlyRate(uint256 rate) external onlyRewardsGovernor {
        assignRewards();
        proRataPoolMonthlyRate = rate;
    }

    function topUpFixedPool(uint256 amount) external {
        fixedPool = fixedPool.add(amount);
        require(externalToken.transferFrom(msg.sender, address(this), amount), "Rewards::topUpFixedPool - insufficient allowance");
    }

    function topUpProRataPool(uint256 amount) external {
        proRataPool = proRataPool.add(amount);
        require(erc20.transferFrom(msg.sender, address(this), amount), "Rewards::topUpProRataPool - insufficient allowance");
    }

    function getOrbsBalance(address addr) external view returns (uint256) {
        return orbsBalance[addr];
    }

    function getExternalTokenBalance(address addr) external view returns (uint256) {
        return externalTokenBalance[addr];
    }

    function getLastPayedAt() external view returns (uint256) {
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

        uint256 totalStake;
        currentCommittee.length = addrs.length;
        for (uint i = 0; i < addrs.length; i++) {
            totalStake += stakes[i];
            currentCommittee[i] = CommitteeMember({
                addr: addrs[i],
                stake: stakes[i]
            });
        }
        currentTotalStake = totalStake;
    }

    uint constant MAX_REWARD_BUCKET_ITERATIONS = 6;

    function assignRewards() public returns (uint256) {
        // TODO we often do integer division for rate related calculation, which floors the result. Do we need to address this?
        // TODO for an empty committee or a committee with 0 total stake the divided amounts will be locked in the contract FOREVER

        uint256 duration = now.sub(lastPayedAt);

        // Fee pool
        uint bucketsPayed = 0;
        uint feePoolAmount = 0;
        while (bucketsPayed < MAX_REWARD_BUCKET_ITERATIONS && lastPayedAt < now) {
            uint256 bucketStart = _bucketTime(lastPayedAt);
            uint256 bucketEnd = bucketStart.add(bucketTimePeriod);
            uint256 payUntil = Math.min(bucketEnd, now);
            uint256 bucketDuration = payUntil.sub(lastPayedAt);
            uint256 remainingBucketTime = bucketEnd.sub(lastPayedAt);
            uint256 amount = feePoolBuckets[bucketStart] * bucketDuration / remainingBucketTime;

            feePoolAmount += amount;
            feePoolBuckets[bucketStart] = feePoolBuckets[bucketStart].sub(amount);
            lastPayedAt = payUntil;

            assert(lastPayedAt <= bucketEnd);
            if (lastPayedAt == bucketEnd) {
                delete feePoolBuckets[bucketStart];
            }

            bucketsPayed++;
        }
        assignAmountFixed(feePoolAmount, TokenType.Orbs);

        // Pro-rata pool
        amount = Math.min(proRataPoolMonthlyRate.mul(duration).div(30 days), proRataPool);
        assignAmountProRata(amount, TokenType.Orbs);
        proRataPool = proRataPool.sub(amount);

        // Fixed pool
        amount = Math.min(fixedPoolMonthlyRate.mul(duration).div(30 days), fixedPool);
        assignAmountFixed(amount, TokenType.ExternalToken);
        fixedPool = fixedPool.sub(amount);

        return lastPayedAt;
    }

    function addToBalance(address addr, uint256 amount, TokenType tokenType) private {
        if (tokenType == TokenType.Orbs) {
            orbsBalance[addr] = orbsBalance[addr].add(amount);
        } else {
            assert(tokenType == TokenType.ExternalToken);
            externalTokenBalance[addr] = externalTokenBalance[addr].add(amount);
        }
    }

    function assignRoundingRemainder(uint256 remainder, TokenType tokenType) private {
        if (remainder > 0 && currentCommittee.length > 0) {
            address addr = currentCommittee[now % currentCommittee.length].addr;
            addToBalance(addr, remainder, tokenType);
        }
    }

    function assignAmountProRata(uint256 amount, TokenType tokenType) private {
        uint256 totalAssigned = 0;
        uint256 totalStake = currentTotalStake;

        if (totalStake == 0) { // TODO - handle this case. consider also an empty committee. consider returning a boolean saying if the amount was successfully distributed or not and handle on caller side.
            return;
        }

        for (uint i = 0; i < currentCommittee.length; i++) {
            uint256 curAmount = amount.mul(currentCommittee[i].stake).div(totalStake);
            address curAddr = currentCommittee[i].addr;
            addToBalance(curAddr, curAmount, tokenType);
            totalAssigned = totalAssigned.add(curAmount);
        }

        assignRoundingRemainder(amount.sub(totalAssigned), tokenType);
    }

    function assignAmountFixed(uint256 amount, TokenType tokenType) private {
        uint256 totalAssigned = 0;

        for (uint i = 0; i < currentCommittee.length; i++) {
            uint256 curAmount = amount.div(currentCommittee.length);
            address curAddr = currentCommittee[i].addr;
            addToBalance(curAddr, curAmount, tokenType);
            totalAssigned = totalAssigned.add(curAmount);
        }

        assignRoundingRemainder(amount.sub(totalAssigned), tokenType);
    }

    function fillFeeBuckets(uint256 amount, uint256 monthlyRate) public {
        assignRewards(); // to handle rate change in the middle of a bucket time period (TBD - this is nice to have, consider removing)

        uint256 bucket = _bucketTime(now);

        // add the partial amount to the first bucket
        uint256 bucketAmount = Math.min(amount, monthlyRate.mul(bucketTimePeriod - now % bucketTimePeriod).div(bucketTimePeriod));
        feePoolBuckets[bucket] = feePoolBuckets[bucket].add(bucketAmount);
        amount = amount.sub(bucketAmount);
        emit FeeAddedToBucket(bucket, bucketAmount, feePoolBuckets[bucket]);

        // following buckets are added with the monthly rate
        while (amount > 0) {
            bucket = bucket.add(bucketTimePeriod);
            bucketAmount = Math.min(monthlyRate, amount);
            feePoolBuckets[bucket] = feePoolBuckets[bucket].add(bucketAmount);
            amount = amount.sub(bucketAmount);
            emit FeeAddedToBucket(bucket, bucketAmount, feePoolBuckets[bucket]);
        }

        assert(amount == 0);
    }

    function distributeOrbsTokenRewards(address[] to, uint256[] amounts) external {
        require(to.length == amounts.length, "expected to and amounts to be of same length");

        uint256 totalAmount = 0;
        for (uint i = 0; i < to.length; i++) {
            totalAmount = totalAmount.add(amounts[i]);
        }
        require(totalAmount <= orbsBalance[msg.sender], "not enough balance for this distribution");
        orbsBalance[msg.sender] = orbsBalance[msg.sender].sub(totalAmount);

        erc20.approve(stakingContract, totalAmount);
        stakingContract.distributeRewards(totalAmount, to, amounts);
    }

    function withdrawExternalTokenRewards() public returns (uint256) {
        uint256 amount = externalTokenBalance[msg.sender];
        externalTokenBalance[msg.sender] = externalTokenBalance[msg.sender].sub(amount);
        require(externalToken.transfer(msg.sender, amount), "Rewards::claimExternalTokenRewards - insufficient funds");
        return amount;
    }

    function _bucketTime(uint256 time) private pure returns (uint256) {
        return time - time % bucketTimePeriod;
    }

}

pragma solidity 0.5.16;

import "../IStakingContract.sol";
import "./IContractRegistry.sol";

/// @title Rewards contract interface
interface IRewards {
    event StakingRewardAssigned(address[] assignee, uint256[] amount, uint256[] balance);
    event FeesAndBootstrapRewardAssigned(address[] assignee, uint256 fees_amount, uint256 bootstrap_amount);
    
    event StakingRewardsDistributed(address indexed sender, address[] to, uint256[] amounts);
    event BootstrapRewardWithdrawn(address indexed sender, uint256 amount);
    event FeesBalanceWithdrawn(address indexed sender, uint256 amount);

    event StakingRewardMonthlyRateSet(uint256 rate);
    event BootstrapMonthlyRateSet(uint256 rate);
 
    event StakingPoolAdded(uint256 amount);
    event BootstrapPoolAdded(uint256 amount);
    event FeeAdded(uint256 amount, uint256 from_bucket, uint256 to_bucket); // why do we need an event per bucket?

    event ContractRegistryChanged(IContractRegistry _contractRegistry);


    /*
     *   External methods
     */

    /// @dev Calculates and assigns validator rewards for the time period since the last reward calculation
    function assignRewards() external returns (uint256);

    /// @return Returns the currently unclaimed staking reward balance (in ORBS) of the given address.
    function getStakingRewardBalance(address addr) external view returns (uint256);

    /// @return Returns the currently unclaimed fees balance (in ORBS) of the given address.
    function getFeesBalance(address addr) external view returns (uint256);

    /// @return Returns the currently unclaimed bootstrap reward balance (in DAI / alternative token) of the given address.
    function getBootstrapRewardBalance(address addr) external view returns (uint256);

    /// @dev Distributes msg.sender's staking reward to a list of addresses transferring directly into the staking contract.
    function distributeStakingReward(address[] calldata to, uint256[] calldata amounts) external;

    /// @dev Transfer all of msg.sender's outstanding bootstrap reward to their account
    function withdrawBootstrapReward() external;

    /// @dev Transfer all of msg.sender's outstanding fees to their account
    function withdrawFeesBalance() external;

    /// @return The timestamp of the last reward allocation.
    function getLastRewardAllocation() external view returns (uint256);

    /// May be removed in an approve only arch
    /// @dev Transfers the given amount of external tokens form the sender to this contract an update the pool.
    function topUpBootstrapPool(uint256 amount) external;  

    /// May be removed in an approve only arch
    /// @dev Transfers the given amount of orbs tokens form the sender to this contract an update the pool.
    function topUpStakingRewardsPool(uint256 amount) external;

    /// @dev Called by: subscriptions contract
    /// Top-ups the fee pool with the given amount at the given rate (typically called by the subscriptions contract)
    function fillFeeBuckets(uint256 amount, uint256 monthlyRate, uint256 first_bucket) external; //consider replace month with ThirtyDay

    /*
     *   Methods restricted to other Orbs contracts
     */

    /// @dev Called by: elections contract (committee provider)
    /// Notifies a change in the committee
    function committeeChanged(address[] calldata addrs, uint256[] calldata stakes) external /* onlyCommitteeProvider */;

    /*
    *   Reward-governor methods
    */

    /// @dev Assigns rewards and sets a new monthly rate for the fixed pool.
    function setBootstrapMonthlyRate(uint256 rate) external /* onlyRewardsGovernor */;

    /// @dev Assigns rewards and sets a new monthly rate for the pro-rata pool.
    function setStakingRewardMonthlyRate(uint256 rate) external /* onlyRewardsGovernor */;

    /*
     * General governance
     */

    /// @dev Updates the address of the contract registry
    function setContractRegistry(IContractRegistry _contractRegistry) external /* onlyOwner */;

}

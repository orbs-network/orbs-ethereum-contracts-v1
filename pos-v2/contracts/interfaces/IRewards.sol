pragma solidity 0.5.16;

import "../IStakingContract.sol";
import "./IContractRegistry.sol";

/// @title Rewards contract interface
interface IRewards {
    event RewardAssigned(address assignee, uint256 amount, uint256 balance);
    event FeeAddedToBucket(uint256 bucketId, uint256 added, uint256 total);

    /*
     *   External methods
     */

    /// @dev Calculates and assigns validator rewards for the time period since the last reward calculation
    function assignRewards() external returns (uint256);

    /// @return Returns the currently unclaimed orbs token reward balance of the given address.
    function getOrbsBalance(address addr) external view returns (uint256);

    /// @return Returns the currently unclaimed external token reward balance of the given address.
    function getExternalTokenBalance(address addr) external view returns (uint256);

    /// @dev Distributes msg.sender's orbs token rewards to a list of addresses, by transferring directly into the staking contract.
    function distributeOrbsTokenRewards(address[] calldata to, uint256[] calldata amounts) external;

    /// @dev Transfer all of msg.sender's outstanding external rewards to their account
    function withdrawExternalTokenRewards() external returns (uint256);

    /// @return The timestamp of the last reward allocation.
    function getLastPayedAt() external view returns (uint256);

    /// @dev Transfers the given amount of external tokens form the sender to this contract an update the pool.
    function topUpFixedPool(uint256 amount) external;

    /// @dev Transfers the given amount of orbs tokens form the sender to this contract an update the pool.
    function topUpProRataPool(uint256 amount) external;

    /// @dev Called by: subscriptions contract
    /// Top-ups the fee pool with the given amount at the given rate (typically called by the subscriptions contract)
    function fillFeeBuckets(uint256 amount, uint256 monthlyRate) external;

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
    function setFixedPoolMonthlyRate(uint256 rate) external /* onlyRewardsGovernor */;

    /// @dev Assigns rewards and sets a new monthly rate for the pro-rata pool.
    function setProRataPoolMonthlyRate(uint256 rate) external /* onlyRewardsGovernor */;

    /*
     * General governance
     */

    /// @dev Updates the address of the contract registry
    function setContractRegistry(IContractRegistry _contractRegistry) external /* onlyOwner */;


}

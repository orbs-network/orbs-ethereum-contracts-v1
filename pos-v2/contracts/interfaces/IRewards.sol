pragma solidity 0.4.26;

import "./IStakingContract.sol";

/// @title Rewards contract interface
interface IRewards {
    event RewardAssigned(address assignee, uint256 amount, uint256 balance);
    event FeeAddedToBucket(uint256 bucketId, uint256 added, uint256 total);

    /*
     *   External methods
     */

    /// @dev Calculates and assigns validator rewards for the time period since the last reward calculation
    function assignRewards() external returns (uint256);

    /// @return Returns the currently unclaimed reward balance of the given address.
    function getBalance(address addr) external view returns (uint256);

    /// @dev Distributes msg.sender's rewards to a list of addresses, by transferring directly into the staking contract.
    function distributeRewards(address[] to, uint256[] amounts) external;

    /// @return The timestamp of the last reward allocation.
    function getLastPayedAt() external view returns (uint256);

    /*
     *   Methods called by other Orbs contracts
     */
    /// @dev Called by: elections contract (committee provider)
    /// Notifies a change in the committee
    function committeeChanged(address[] addrs, uint256[] stakes) external /* onlyCommitteeProvider */;

    /// @dev Called by: subscriptions contract
    /// Top-ups the fee pool with the given amount at the given rate
    function fillFeeBuckets(uint256 amount, uint256 monthlyRate) external;

    /*
     *   Owner methods
     */

    function setCommitteeProvider(address _committeeProvider) external /* onlyOwner */;

    function setStakingContract(IStakingContract _stakingContract) external /* onlyOwner */;

}

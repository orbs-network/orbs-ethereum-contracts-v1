pragma solidity 0.4.25;

interface IStakingListener {
    function staked(address stakeOwner, uint256 amount) external;
    function unstaked(address stakeOwner, uint256 amount) external;
    function distributedStake(address[] stakeOwners, uint256[] amounts) external;
}

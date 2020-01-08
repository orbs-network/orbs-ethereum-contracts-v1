pragma solidity 0.4.26;

interface IStakingListener {
    function staked(address stakeOwner, uint256 amount, uint256 totalStakedAmount) external;
    function unstaked(address stakeOwner, uint256 amount, uint256 totalStakedAmount) external;
}

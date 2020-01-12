pragma solidity 0.4.26;

interface IStakingListener {
    function staked(address stakeOwner, uint256 amount) external;
    function unstaked(address stakeOwner, uint256 amount) external;
}

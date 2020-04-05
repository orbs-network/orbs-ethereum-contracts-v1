pragma solidity 0.5.16;

interface ICommitteeListener {
    function committeeChanged(address[] calldata addrs, uint256[] calldata stakes) external;
}

pragma solidity 0.4.26;

interface ICommitteeListener {
    function committeeChanged(address[] addrs, uint256[] stakes) external;
}

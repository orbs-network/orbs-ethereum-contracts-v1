pragma solidity 0.5.3;

import "./IOrbsNetworkTopology.sol";


contract MockOrbsNetwork is IOrbsNetworkTopology {

    address[] nodes = [address(0)];
    bytes4[] ips = [bytes4(0xFFFFFFFF)];

    function getNetworkTopology() public view returns (
        address[] memory nodeAddresses,
        bytes4[] memory ipAddresses
    ) {
        return (nodes, ips);
    }
}

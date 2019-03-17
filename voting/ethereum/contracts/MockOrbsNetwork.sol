pragma solidity 0.5.3;

import "./IOrbsNetworkTopology.sol";


contract MockOrbsNetwork is IOrbsNetworkTopology {

    bytes20[] nodes = new bytes20[](0);
    bytes4[] ips = new bytes4[](0);

    function getNetworkTopology()
        public
        view
        returns (bytes20[] memory nodeAddresses,bytes4[] memory ipAddresses)
    {
        return (nodes, ips);
    }
}

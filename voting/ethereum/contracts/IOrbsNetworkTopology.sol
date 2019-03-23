pragma solidity 0.4.25;


interface IOrbsNetworkTopology {
    function getNetworkTopology()
        external
        view
        returns (bytes20[] nodeAddresses, bytes4[] ipAddresses);
}


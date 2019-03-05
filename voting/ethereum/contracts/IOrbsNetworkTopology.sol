pragma solidity 0.5.3;


interface IOrbsNetworkTopology {
    function getNetworkTopology()
        external
        view
        returns (address[] memory nodeAddresses, bytes4[] memory ipAddresses);
}


pragma solidity 0.5.3;


interface IOrbsNetworkTopology {
    function getNetworkTopology()
        external
        view
        returns (bytes20[] memory nodeAddresses, bytes4[] memory ipAddresses);
}


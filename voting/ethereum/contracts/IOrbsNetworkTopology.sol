pragma solidity 0.4.25;


interface IOrbsNetworkTopology {

    /// @dev returns an array of pairs with node addresses and ip addresses.
    function getNetworkTopology()
        external
        view
        returns (bytes20[] nodeAddresses, bytes4[] ipAddresses);
}


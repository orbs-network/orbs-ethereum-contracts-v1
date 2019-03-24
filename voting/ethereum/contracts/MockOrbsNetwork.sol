pragma solidity 0.4.25;

import "./IOrbsNetworkTopology.sol";


contract MockOrbsNetwork is IOrbsNetworkTopology {

    bytes20[] nodes = [
        bytes20(hex"6e2cb55e4cbe97bf5b1e731d51cc2c285d83cbf9"),
        bytes20(hex"D27E2E7398E2582F63D0800330010B3E58952FF6"),
        bytes20(hex"A328846CD5B4979D68A8C58A9BDFEEE657B34DE7"),
        bytes20(hex"54018092153DCDEA764F89D33B086C7114E11985")
    ];

    bytes4[] ips = [
        bytes4(hex"0DEA8F0F"),
        bytes4(hex"0DEA924A"),
        bytes4(hex"0DEA931B"),
        bytes4(hex"344221F9")
    ];

    function getNetworkTopology()
        external
        view
        returns (bytes20[] nodeAddresses, bytes4[] ipAddresses)
    {
        return (nodes, ips);
    }
}

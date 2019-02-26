pragma solidity ^0.5.3;

interface IOrbsNetworkTopology {
    // TODO - break this into two calls - getValidators and getValidatorDate
    function getNetworkTopology() external view returns (address[] memory nodeAddresses, bytes4[] memory ipAddresses);
}


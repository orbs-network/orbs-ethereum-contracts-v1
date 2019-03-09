pragma solidity 0.5.3;

import "./../contracts/IOrbsValidatorsRegistry.sol";

// This contract tries to register as validator in the constructor.
// Using the constructor because during constructor execution EXTCODESIZE lies
contract ValidatorRegisteringContract {
    constructor(
        address valRegAddr,
        string memory name,
        bytes memory ipAddress,
        string memory website,
        address orbsAddress
    ) public payable {
        IOrbsValidatorsRegistry(valRegAddr).register(
            name,
            ipAddress,
            website,
            orbsAddress
        );
    }
}


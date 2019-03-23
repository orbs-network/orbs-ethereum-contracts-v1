pragma solidity 0.4.25;

import "./../contracts/IOrbsGuardians.sol";

// This contract tries to register as guardian in the constructor.
// Using the constructor because during constructor execution EXTCODESIZE lies
contract GuardianRegisteringContract {
    constructor(address guardiansAddress, string memory name, string memory url) public payable {
        IOrbsGuardians(guardiansAddress).register.value(msg.value)(name, url);
    }
}

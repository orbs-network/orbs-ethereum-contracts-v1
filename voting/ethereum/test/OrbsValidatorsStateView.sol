pragma solidity 0.5.3;

import "./../contracts/OrbsValidators.sol";

contract OrbsValidatorsStateView is OrbsValidators {
    constructor(address registry_, uint validatorLimit_)
        OrbsValidators(registry_, validatorLimit_) public {
    }

    function getApprovedValidatorAt(uint index) public view returns (address) {
        return approvedValidators[index];
    }
}

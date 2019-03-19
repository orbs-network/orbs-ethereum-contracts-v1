pragma solidity 0.5.3;

import "./../../../voting/ethereum/contracts/IOrbsValidators.sol";

contract OrbsValidatorsMock is IOrbsValidators {

    address[] public approvedValidators;

    constructor(address[] memory validators_) public {
        approvedValidators = validators_;
    }

    function addValidator(address) public {
        //approvedValidators.push(validator);
    }
    function remove(address) public {

    }
    function isValidator(address) public view returns (bool) {
        return true;
    }

    function getValidators() public view returns (bytes20[] memory) {
        return new bytes20[](0);
    }
    function getApprovalBockHeight(address)
        external
        view
        returns (uint)
    {
        return 0;
    }
}

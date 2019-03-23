pragma solidity 0.4.25;

import "./../../../voting/ethereum/contracts/IOrbsValidators.sol";

contract OrbsValidatorsMock is IOrbsValidators {

    address[] public approvedValidators;

    constructor(address[] memory validators_) public {
        approvedValidators = validators_;
    }

    function approve(address) public
    {
    }
    
    function remove(address) public
    {

    }
    function isValidator(address validator) public view returns (bool)
    {
        for (uint i = 0; i < approvedValidators.length; i++) {
            if (approvedValidators[i] == validator) {
                return true;
            }
        }
        return false;
    }
    function isApproved(address) public view returns (bool)
    {
        return false;
    }
    function getValidators() public view returns (address[] memory)
    {
        return approvedValidators;
    }
    function getValidatorsBytes20() public view returns (bytes20[] memory)
    {
        return new bytes20[](0);
    }
    function getApprovalBlockNumber(address)
        public
        view
        returns (uint)
    {
        return 0;
    }
}

pragma solidity 0.5.3;


import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IOrbsNetworkTopology.sol";
import "./IOrbsValidators.sol";
import "./OrbsValidatorsRegistry.sol";


contract OrbsValidators is Ownable, IOrbsValidators, IOrbsNetworkTopology {

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    // Maximum number of the federation members.
    uint public constant MAX_VALIDATOR_LIMIT = 100;
    uint public validatorLimit;

    IOrbsValidatorsRegistry public registry;

    address[] public approvedValidators;

    constructor(address registry_, uint validatorLimit_) public {
        require(registry_ != address(0), "Registry contract address 0");
        require(validatorLimit_ > 0, "Limit must be positive");
        require(validatorLimit_ <= MAX_VALIDATOR_LIMIT, "Limit is too high");

        validatorLimit = validatorLimit_;
        registry = IOrbsValidatorsRegistry(registry_);
    }

    function addValidator(address validator) public onlyOwner {
        require(validator != address(0), "Address must not be 0!");
        require(
            approvedValidators.length <= validatorLimit - 1 &&
            approvedValidators.length <= MAX_VALIDATOR_LIMIT - 1,
                "Can't add more members!"
        );

        require(!isApproved(validator), "Address must not be already a member");

        approvedValidators.push(validator);
        emit ValidatorAdded(validator);
    }

    function remove(address validator) public onlyOwner {
        uint approvedLength = approvedValidators.length;
        for (uint i = 0; i < approvedLength; ++i) {
            if (approvedValidators[i] == validator) {
                approvedValidators[i] = approvedValidators[approvedLength - 1];
                delete approvedValidators[i];
                approvedValidators.length--;

                emit ValidatorRemoved(validator);
                return;
            }
        }
        revert("Unknown Validator Address");
    }

    function isValidator(address validator) public view returns (bool) {
        return isApproved(validator) && registry.isValidator(validator);
    }

    function getValidators() public view returns (bytes20[] memory) {
        uint activeValidatorCount = countRegisteredValidators();
        bytes20[] memory validators = new bytes20[](activeValidatorCount);

        uint pushAt = 0;
        uint approvedLength = approvedValidators.length;
        for (uint i = 0; i < approvedLength; i++) {
            if (registry.isValidator(approvedValidators[i])) {
                validators[pushAt] = bytes20(approvedValidators[i]);
                pushAt++;
            }
        }
        return validators;
    }

    function getNetworkTopology()
        public
        view
        returns (address[] memory nodeAddresses, bytes4[] memory ipAddresses)
    {
        bytes20[] memory validators = getValidators(); // filter unregistered
        uint validatorsLength = validators.length;
        nodeAddresses = new address[](validatorsLength);
        ipAddresses = new bytes4[](validatorsLength);

        for (uint i = 0; i < validatorsLength; i++) {
            bytes memory ip;
            address orbsAddr;
            (,ip,,orbsAddr,,) = registry.getValidatorData(address(validators[i]));
            nodeAddresses[i] = orbsAddr;
            ipAddresses[i] = ipAddress(ip);
        }
    }

    function isApproved(address m) internal view returns (bool) {
        uint approvedLength = approvedValidators.length;
        for (uint i = 0; i < approvedLength; i++) {
            if (approvedValidators[i] == m) {
                return true;
            }
        }
        return false;
    }

    function countRegisteredValidators() internal view returns (uint) {
        uint registeredCount = 0;
        uint approvedLength = approvedValidators.length;
        for (uint i = 0; i < approvedLength; i++) {
            if (registry.isValidator(approvedValidators[i])) {
                registeredCount++;
            }
        }
        return registeredCount;
    }

    function ipAddress(bytes memory inBytes)
        internal
        pure
        returns (bytes4)
    {
        bytes4 result;
        uint256 bytesAvailable = inBytes.length < 4 ? inBytes.length : 4;
        for (uint256 i = 0; i < bytesAvailable; i++) {
            bytes4 shifter = inBytes[i];
            shifter = shifter >> 8 * i;
            result = result | shifter;
        }
        return result;
    }
}
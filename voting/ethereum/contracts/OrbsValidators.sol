pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IOrbsNetworkTopology.sol";
import "./OrbsValidatorsRegistry.sol";


interface IOrbsValidators {
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    function addValidator(address _validator) external;
    function isValidator(address m) external view returns (bool);
    function getValidators() external view returns (bytes20[] memory);
}


contract OrbsValidators is Ownable, IOrbsValidators, IOrbsNetworkTopology {

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    // Maximum number of the federation members.
    uint public constant MAX_VALIDATOR_LIMIT = 100;
    uint public validatorLimit;

    IOrbsValidatorsRegistry public registry;

    address[] public validators;

    constructor(address _registryAddress, uint _validatorLimit) public {
        require(_registryAddress != address(0), "Registry contract address 0");
        require(_validatorLimit > 0, "limit must be positive");
        require(_validatorLimit <= MAX_VALIDATOR_LIMIT, "limit is too high");

        validatorLimit = _validatorLimit;
        registry = IOrbsValidatorsRegistry(_registryAddress);
    }

    function addValidator(address _validator) public onlyOwner {
        require(_validator != address(0), "Address must not be 0!");
        require(validators.length <= validatorLimit - 1 && validators.length <= MAX_VALIDATOR_LIMIT - 1, "Can't add more members!");

        require(!wasAdded(_validator), "Address must not be already a member");

        validators.push(_validator);
        emit ValidatorAdded(_validator);
    }

    function wasAdded(address m) internal view returns (bool) {
        for (uint i = 0; i < validators.length; i++) {
            if (validators[i] == m) {
                return true;
            }
        }
        return false;
    }

    function isValidator(address m) public view returns (bool) {
        return wasAdded(m) && registry.isValidator(m);
    }

    function getValidators() public view returns (bytes20[] memory) {
        uint activeValidatorCount = countRegisteredValidators();
        bytes20[] memory validatorAddresses = new bytes20[](activeValidatorCount);

        uint pushAt = 0;
        for (uint i = 0; i < validators.length; i++) {
            if (registry.isValidator(validators[i])) {
                validatorAddresses[pushAt] = bytes20(validators[i]);
                pushAt++;
            }
        }
        return validatorAddresses;
    }

    function remove(address _validator) public onlyOwner {
        for (uint i = 0; i < validators.length; ++i) {
            if (validators[i] == _validator) {
                validators[i] = validators[validators.length - 1];
                delete validators[i];
                validators.length--;

                emit ValidatorRemoved(_validator);
                return;
            }
        }
        revert("Unknown Validator Address");
    }

    function getNetworkTopology() public view returns (address[] memory nodeAddresses, bytes4[] memory ipAddresses) {
        bytes20[] memory activeValidators = getValidators(); // already filters out those without data
        nodeAddresses = new address[](activeValidators.length);
        ipAddresses = new bytes4[](activeValidators.length);

        for (uint i = 0; i < activeValidators.length; i++) {
            bytes memory ip;
            address orbsAddress;
            (,ip,,orbsAddress) = registry.getValidatorData(address(activeValidators[i]));
            nodeAddresses[i] = orbsAddress;
            ipAddresses[i] = ipv4Address(ip);
        }
    }

    function ipv4Address(bytes memory inBytes) pure internal returns (bytes4 outBytes4) {
        uint256 bytesAvailable = inBytes.length < 4 ? inBytes.length : 4;
        for (uint256 i = 0; i < bytesAvailable; i++) {
            bytes4 shifter = inBytes[i];
            shifter = shifter >> 8 * i;
            outBytes4 = outBytes4 | shifter;
        }
    }

    function countRegisteredValidators() internal view returns (uint count) {
        for (uint i = 0; i < validators.length; i++) {
            if (registry.isValidator(validators[i])) {
                count++;
            }
        }
    }
}
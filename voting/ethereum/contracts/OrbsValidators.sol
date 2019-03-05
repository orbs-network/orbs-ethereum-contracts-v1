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

    constructor(address _registryAddress, uint _validatorLimit) public {
        require(_registryAddress != address(0), "Registry contract address 0");
        require(_validatorLimit > 0, "Limit must be positive");
        require(_validatorLimit <= MAX_VALIDATOR_LIMIT, "Limit is too high");

        validatorLimit = _validatorLimit;
        registry = IOrbsValidatorsRegistry(_registryAddress);
    }

    function addValidator(address _validator) public onlyOwner {
        require(_validator != address(0), "Address must not be 0!");
        require(
            approvedValidators.length <= validatorLimit - 1 &&
            approvedValidators.length <= MAX_VALIDATOR_LIMIT - 1,
                "Can't add more members!"
        );

        require(!isApproved(_validator), "Address must not be already a member");

        approvedValidators.push(_validator);
        emit ValidatorAdded(_validator);
    }

    function remove(address _validator) public onlyOwner {
        uint approvedLength = approvedValidators.length;
        for (uint i = 0; i < approvedLength; ++i) {
            if (approvedValidators[i] == _validator) {
                approvedValidators[i] = approvedValidators[approvedLength - 1];
                delete approvedValidators[i];
                approvedValidators.length--;

                emit ValidatorRemoved(_validator);
                return;
            }
        }
        revert("Unknown Validator Address");
    }

    function isValidator(address m) public view returns (bool) {
        return isApproved(m) && registry.isValidator(m);
    }

    function getValidators() public view returns (bytes20[] memory validators) {
        uint activeValidatorCount = countRegisteredValidators();
        validators = new bytes20[](activeValidatorCount);

        uint pushAt = 0;
        uint approvedLength = approvedValidators.length;
        for (uint i = 0; i < approvedLength; i++) {
            if (registry.isValidator(approvedValidators[i])) {
                validators[pushAt] = bytes20(approvedValidators[i]);
                pushAt++;
            }
        }
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
            (,ip,,orbsAddr) = registry.getValidatorData(address(validators[i]));
            nodeAddresses[i] = orbsAddr;
            ipAddresses[i] = ipv4Address(ip);
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

    function ipv4Address(bytes memory inBytes)
        internal
        pure
        returns (bytes4 outBytes4)
    {
        uint256 bytesAvailable = inBytes.length < 4 ? inBytes.length : 4;
        for (uint256 i = 0; i < bytesAvailable; i++) {
            bytes4 shifter = inBytes[i];
            shifter = shifter >> 8 * i;
            outBytes4 = outBytes4 | shifter;
        }
    }
}
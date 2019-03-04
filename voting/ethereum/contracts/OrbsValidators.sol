pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IOrbsNetworkTopology.sol";

interface IOrbsValidatorsRegistry {
    function register(string calldata _name, bytes calldata _ipvAddress, string calldata _website, address _orbsAddress) external;
    function getValidatorData(address _validator) external view returns (string memory _name, bytes memory _ipvAddress, string memory _website, address _orbsAddress);
    function getOrbsAddress(address _validator) external view returns (address _orbsAddress);
}

interface IOrbsValidators {
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    function addValidator(address _validator) external;
    function isValidator(address m) external view returns (bool);
    function getValidators() external view returns (bytes20[] memory);
}

contract OrbsValidators is Ownable, IOrbsValidators, IOrbsValidatorsRegistry, IOrbsNetworkTopology {

    struct ValidatorData {
        string name;
        bytes ipvAddress;
        string website;
        address orbsAddress;
    }

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    // Maximum number of the federation members.
    uint public constant MAX_VALIDATOR_LIMIT = 100;
    uint public validatorLimit;

    IOrbsValidatorsRegistry public registry;

    address[] public validators;
    mapping (address => ValidatorData) public validatorsData;

    constructor(address _registryAddress, uint _validatorLimit) public {
        require(_registryAddress != address(0), "Registry contract address may not be 0!");
        require(_validatorLimit > 0, "Validator limit must be a positive value");
        require(_validatorLimit <= MAX_VALIDATOR_LIMIT, "Validator limit too high");

        validatorLimit = _validatorLimit;
        registry = IOrbsValidatorsRegistry(_registryAddress);
    }

    function addValidator(address _validator) public onlyOwner {
        require(_validator != address(0), "Address must not be 0!");
        require(validators.length <= validatorLimit - 1 && validators.length <= MAX_VALIDATOR_LIMIT - 1, "Can't add more members!");

        require(!isValidator(_validator), "Address must not be already a member");

        validators.push(_validator);
        emit ValidatorAdded(_validator);
    }

    function wasAdded(address m) public view returns (bool) {
        for (uint i = 0; i < validators.length; i++) {
            if (validators[i] == m) {
                return true;
            }
        }
        return false;
    }

    function isValidator(address m) public view returns (bool) {
        return hasData(m);
    }

    function getValidators() public view returns (bytes20[] memory) {
        uint activeValidatorCount = countActiveValidators();
        bytes20[] memory validatorAddresses = new bytes20[](activeValidatorCount);

        uint pushAt = 0;
        for (uint i = 0; i < validators.length; i++) {
            if (hasData(validators[i])) {
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
                delete validatorsData[_validator];
                delete validators[i];
                validators.length--;

                emit ValidatorRemoved(_validator);
                return;
            }
        }
        revert("Unknown Validator Address");
    }

    function register(string memory _name, bytes memory _ipvAddress, string memory _website, address _orbsAddress) public {
        require(bytes(_name).length > 0, "Please provide a valid name");
        require(bytes(_website).length > 0, "Please provide a valid website");
        require(isIpv4(_ipvAddress), "Please pass an address of up to 4 bytes");
        require(_orbsAddress != address(0), "Please provide a valid Orbs Address");
        require(wasAdded(msg.sender), "Validator must first be listed");

        for (uint i = 0; i < validators.length; i++) {
            if (validators[i] == msg.sender) {
                continue;
            }
            ValidatorData storage otherValidator = validatorsData[validators[i]];
            require(keccak256(bytes(otherValidator.name)) != keccak256(bytes(_name)), "Name is already in use by another validator");
            require(keccak256(bytes(otherValidator.ipvAddress)) != keccak256(bytes(_ipvAddress)), "IP address is already in use by another validator");
            require(keccak256(bytes(otherValidator.website)) != keccak256(bytes(_website)), "URL is already in use by another validator");
            require(otherValidator.orbsAddress != _orbsAddress, "Orbs Address is already in use by another validator");
        }

        validatorsData[msg.sender] = ValidatorData(_name, _ipvAddress, _website, _orbsAddress);
    }

    function getValidatorData(address _validator) public view returns (string memory _name, bytes memory _ipvAddress, string memory _website, address _orbsAddress) {
        require(isValidator(_validator), "Please provide a listed Validator with set data");

        return (validatorsData[_validator].name, validatorsData[_validator].ipvAddress, validatorsData[_validator].website, validatorsData[_validator].orbsAddress);
    }

    function getOrbsAddress(address _validator) public view returns (address _orbsAddress) {
        require(isValidator(_validator), "Please provide a listed Validator");

        return validatorsData[_validator].orbsAddress;
    }

    function getNetworkTopology() public view returns (address[] memory nodeAddresses, bytes4[] memory ipAddresses) {
        bytes20[] memory activeValidators = getValidators(); // already filters out those without data
        nodeAddresses = new address[](activeValidators.length);
        ipAddresses = new bytes4[](activeValidators.length);

        for (uint i = 0; i < activeValidators.length; i++) {
            ValidatorData storage data = validatorsData[address(activeValidators[i])];
            nodeAddresses[i] = data.orbsAddress;
            ipAddresses[i] = ipv4Address(data.ipvAddress);
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

    function isIpv4(bytes memory inBytes) internal pure returns (bool){
        for (uint256 i = 4; i < inBytes.length; i++) { // scan byte #5 onward
            if (inBytes[i] != 0) {
                return false;
            }
        }
        return true;
    }

    function hasData(address validator) internal view returns (bool) {
        return bytes(validatorsData[validator].name).length > 0;
    }

    function countActiveValidators() internal view returns (uint count) {
        for (uint i = 0; i < validators.length; i++) {
            if (hasData(validators[i])) {
                count++;
            }
        }
    }
}
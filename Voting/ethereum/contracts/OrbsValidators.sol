pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IOrbsNetworkTopology.sol";

interface IOrbsValidatorsRegistry {
    // TODO rename register to setValidatorData
    function register(string calldata _name, bytes calldata _ipvAddress, string calldata _website, address _orbsAddress) external;
    function getValidatorData(address _validator) external view returns (string memory _name, bytes memory _ipvAddress, string memory _website, address _orbsAddress);
    function getOrbsAddress(address _validator) external view returns (address _orbsAddress);
}

interface IOrbsValidators {
    function addValidator(address _validator) external;
    function isValidator(address m) external view returns (bool);
    function getValidators() external view returns (address[] memory);
    function leave() external returns (bool);
}

contract OrbsValidators is Ownable, IOrbsValidators, IOrbsValidatorsRegistry, IOrbsNetworkTopology {

    struct ValidatorData {
        string name;
        bytes ipvAddress;
        string website;
        address orbsAddress;
    }

    event ValidatorAdded(address indexed validator);
    event ValidatorLeft(address indexed validator);

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    // Maximum number of the federation members.
    uint public constant MAX_FEDERATION_MEMBERS = 100;

    address[] public validators;
    mapping (address => ValidatorData) public validatorsData;

    function addValidator(address _validator) public onlyOwner {
        require(_validator != address(0), "Address must not be 0!");
        require(validators.length <= MAX_FEDERATION_MEMBERS - 1, "Can't add more members!");

        require(!isValidator(_validator), "Address must not be already a member");

        validators.push(_validator);
        emit ValidatorAdded(_validator);
    }

    function isValidator(address m) public view returns (bool) {
        for (uint i = 0; i < validators.length; ++i) {
            if (validators[i] == m) {
                return true;
            }
        }
        return false;
    }

    function getValidators() public view returns (address[] memory) {
        return validators;
    }

    function leave() public returns (bool) {
        for (uint i = 0; i < validators.length; ++i) {
            if (validators[i] == msg.sender) {
                validators[i] = validators[validators.length - 1];
                delete validatorsData[msg.sender];
                delete validators[i];
                validators.length--;

                emit ValidatorLeft(msg.sender);
                return true;
            }
        }
        return false;
    }

    function register(string memory _name, bytes memory _ipvAddress, string memory _website, address _orbsAddress) public {
        require(bytes(_name).length > 0, "Please provide a valid name");
        require(bytes(_website).length > 0, "Please provide a valid website");
        require(isIpv4(_ipvAddress), "Please pass an address of up to 4 bytes");
        require(_orbsAddress != address(0), "Please provide a valid Orbs Address");
        require(isValidator(msg.sender), "Caller must be a validator");

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
        require(isValidator(_validator), "Please provide a listed Validator");
        return (validatorsData[_validator].name, validatorsData[_validator].ipvAddress, validatorsData[_validator].website, validatorsData[_validator].orbsAddress);
    }

    function getOrbsAddress(address _validator) public view returns (address _orbsAddress) {
        require(isValidator(_validator), "Please provide a listed Validator");
        return validatorsData[_validator].orbsAddress;
    }

    function getNetworkTopology() public view returns (address[] memory nodeAddresses, bytes4[] memory ipAddresses) {
        nodeAddresses = new address[](validators.length);
        ipAddresses = new bytes4[](validators.length);

        for (uint i = 0; i < validators.length; ++i) {
            nodeAddresses[i] = validatorsData[validators[i]].orbsAddress;
            ipAddresses[i] = ipv4Address(validatorsData[validators[i]].ipvAddress);
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

    function isIpv4(bytes memory inBytes) pure internal returns (bool){
        for (uint256 i = 4; i < inBytes.length; i++) { // scan byte #5 onward
            if (inBytes[i] != 0) {
                return false;
            }
        }
        return true;
    }
}
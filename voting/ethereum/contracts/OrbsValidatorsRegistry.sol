pragma solidity 0.5.3;

interface IOrbsValidatorsRegistry {
    event ValidatorLeft(address indexed validator);
    event ValidatorRegistered(address indexed validator);

    function leave() external;
    function register(string calldata _name, bytes calldata _ipvAddress, string calldata _website, address _orbsAddress) external;
    function getValidatorData(address _validator) external view returns (string memory _name, bytes memory _ipvAddress, string memory _website, address _orbsAddress);
    function getOrbsAddress(address _validator) external view returns (address _orbsAddress);
    function isValidator(address m) external view returns (bool);
}

contract OrbsValidatorsRegistry is IOrbsValidatorsRegistry {

    struct ValidatorData {
        string name;
        bytes ipvAddress;
        string website;
        address orbsAddress;
    }

    uint public constant VERSION = 1;

    mapping (address => ValidatorData) public validatorsData;

    mapping (bytes32 => address) public lookupName;
    mapping (bytes32 => address) public lookupIpV4;
    mapping (bytes32 => address) public lookupUrl;
    mapping (address => address) public lookupOrbsAddr;


    function isValidator(address addr) public view returns (bool) {
        return bytes(validatorsData[addr].name).length > 0;
    }

    function leave() public {
        require(isValidator(msg.sender), "Sender is not a listed Validator");

        ValidatorData storage data = validatorsData[msg.sender];

        delete lookupName[keccak256(bytes(data.name))];
        delete lookupIpV4[keccak256(data.ipvAddress)];
        delete lookupUrl[keccak256(bytes(data.website))];
        delete lookupOrbsAddr[data.orbsAddress];

        delete validatorsData[msg.sender];

        emit ValidatorLeft(msg.sender);
    }

    function register(string memory _name, bytes memory _ipvAddress, string memory _website, address _orbsAddress) public {
        require(bytes(_name).length > 0, "Please provide a valid name");
        require(bytes(_website).length > 0, "Please provide a valid website");
        require(isIpv4(_ipvAddress), "Please pass an address of up to 4 bytes");
        require(_orbsAddress != address(0), "Please provide a valid Orbs Address");

        bytes32 nameHash = keccak256(bytes(_name));
        bytes32 ipv4Hash = keccak256(_ipvAddress);
        bytes32 urlHash  = keccak256(bytes(_website));

        require(lookupName[nameHash] == address(0) || lookupName[nameHash] == msg.sender, "Name is already in use by another validator");
        require(lookupIpV4[ipv4Hash] == address(0) || lookupIpV4[ipv4Hash] == msg.sender, "IP address is already in use by another validator");
        require(lookupUrl[urlHash] == address(0) || lookupUrl[urlHash] == msg.sender, "URL is already in use by another validator");
        require(lookupOrbsAddr[_orbsAddress] == address(0) || lookupOrbsAddr[_orbsAddress] == msg.sender, "Orbs Address is already in use by another validator");

        lookupName[nameHash] = msg.sender;
        lookupIpV4[ipv4Hash] = msg.sender;
        lookupUrl[urlHash] = msg.sender;
        lookupOrbsAddr[_orbsAddress] = msg.sender;

        validatorsData[msg.sender] = ValidatorData(_name, _ipvAddress, _website, _orbsAddress);
        emit ValidatorRegistered(msg.sender);
    }

    function getValidatorData(address _validator) public view returns (string memory _name, bytes memory _ipvAddress, string memory _website, address _orbsAddress) {
        require(isValidator(_validator), "Unlisted Validator");

        return (validatorsData[_validator].name, validatorsData[_validator].ipvAddress, validatorsData[_validator].website, validatorsData[_validator].orbsAddress);
    }

    function getOrbsAddress(address _validator) public view returns (address _orbsAddress) {
        require(isValidator(_validator), "Unlisted Validator");

        return validatorsData[_validator].orbsAddress;
    }

    function isIpv4(bytes memory inBytes) internal pure returns (bool){
        for (uint256 i = 4; i < inBytes.length; i++) { // allow only 0 bits after the 4th byte
            if (inBytes[i] != 0) {
                return false;
            }
        }
        return true;
    }
}
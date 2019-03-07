pragma solidity 0.5.3;


import "./IOrbsValidatorsRegistry.sol";


contract OrbsValidatorsRegistry is IOrbsValidatorsRegistry {

    struct ValidatorData {
        string name;
        bytes ipAddress;
        string website;
        address orbsAddress;
    }

    uint public constant VERSION = 1;

    mapping(address => ValidatorData) public validatorsData;

    mapping(bytes32 => address) public lookupName;
    mapping(bytes32 => address) public lookupUrl;
    mapping(address => address) public lookupOrbsAddr;

    function register(
        string memory name,
        bytes memory ipAddress,
        string memory website,
        address orbsAddress
    )
        public
    {
        require(bytes(name).length > 0, "Please provide a valid name");
        require(bytes(website).length > 0, "Please provide a valid website");
        require(isIPV4(ipAddress), "Please pass an address of up to 4 bytes");
        require(orbsAddress != address(0), "Please provide a valid Orbs Address");

        bytes32 nameHash = keccak256(bytes(name));
        bytes32 urlHash  = keccak256(bytes(website));

        require(
            lookupName[nameHash] == address(0) ||
            lookupName[nameHash] == msg.sender,
                "Name is already in use by another validator"
        );
        require(
            lookupUrl[urlHash] == address(0) ||
            lookupUrl[urlHash] == msg.sender,
                "URL is already in use by another validator"
        );
        require(
            lookupOrbsAddr[orbsAddress] == address(0) ||
            lookupOrbsAddr[orbsAddress] == msg.sender,
                "Orbs Address is already in use by another validator"
        );

        lookupName[nameHash] = msg.sender;
        lookupUrl[urlHash] = msg.sender;
        lookupOrbsAddr[orbsAddress] = msg.sender;

        validatorsData[msg.sender] = ValidatorData(
            name,
            ipAddress,
            website,
            orbsAddress
        );
        emit ValidatorRegistered(msg.sender);
    }

    function leave() public {
        require(isValidator(msg.sender), "Sender is not a listed Validator");

        ValidatorData storage data = validatorsData[msg.sender];

        delete lookupName[keccak256(bytes(data.name))];
        delete lookupUrl[keccak256(bytes(data.website))];
        delete lookupOrbsAddr[data.orbsAddress];

        delete validatorsData[msg.sender];

        emit ValidatorLeft(msg.sender);
    }

    function getValidatorData(address validator)
        public
        view
        returns (
            string memory name,
            bytes memory ipAddress,
            string memory website,
            address orbsAddress
        )
    {
        require(isValidator(validator), "Unlisted Validator");

        return (
            validatorsData[validator].name,
            validatorsData[validator].ipAddress,
            validatorsData[validator].website,
            validatorsData[validator].orbsAddress
        );
    }

    function getOrbsAddress(address validator)
        public
        view
        returns (address)
    {
        require(isValidator(validator), "Unlisted Validator");

        return validatorsData[validator].orbsAddress;
    }

    function isValidator(address addr) public view returns (bool) {
        return bytes(validatorsData[addr].name).length > 0;
    }

    function isIPV4(bytes memory inBytes) internal pure returns (bool){
        uint inBytesLength = inBytes.length;
        for (uint256 i = 4; i < inBytesLength; i++) { // only 0's beyond the 4th byte
            if (inBytes[i] != 0) {
                return false;
            }
        }
        return true;
    }
}
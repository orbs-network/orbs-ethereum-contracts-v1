pragma solidity 0.5.3;


import "./IOrbsValidatorsRegistry.sol";


contract OrbsValidatorsRegistry is IOrbsValidatorsRegistry {

    struct ValidatorData {
        string name;
        bytes4 ipAddress;
        string website;
        bytes20 orbsAddress;
        uint registeredOnBlock;
        uint lastUpdatedOnBlock;
    }

    uint public constant VERSION = 1;

    mapping(address => ValidatorData) public validatorsData;

    mapping(bytes32 => address) public lookupIp;
    mapping(bytes20 => address) public lookupOrbsAddr;

    function register(
        string memory name,
        bytes4 ipAddress,
        string memory website,
        bytes20 orbsAddress
    )
        public
    {
        require(bytes(name).length > 0, "Please provide a valid name");
        require(bytes(website).length > 0, "Please provide a valid website");
        require(ipAddress != bytes4(0), "Please pass a valid ip address represented as an array of exactly 4 bytes");
        require(orbsAddress != bytes20(0), "Please provide a valid Orbs Address");

        require(
            lookupIp[ipAddress] == address(0) ||
            lookupIp[ipAddress] == msg.sender,
                "IP Address is already in use by another validator"
        );
        require(
            lookupOrbsAddr[orbsAddress] == address(0) ||
            lookupOrbsAddr[orbsAddress] == msg.sender,
                "Orbs Address is already in use by another validator"
        );

        lookupIp[ipAddress] = msg.sender;
        lookupOrbsAddr[orbsAddress] = msg.sender;

        uint registeredOnBlock = validatorsData[msg.sender].registeredOnBlock;
        if (registeredOnBlock == 0) {
            registeredOnBlock = block.number;
        }

        validatorsData[msg.sender] = ValidatorData(
            name,
            ipAddress,
            website,
            orbsAddress,
            registeredOnBlock,
            block.number
        );
        emit ValidatorRegistered(msg.sender);
    }

    function leave() public {
        require(isValidator(msg.sender), "Sender is not a listed Validator");

        ValidatorData storage data = validatorsData[msg.sender];

        delete lookupIp[data.ipAddress];
        delete lookupOrbsAddr[data.orbsAddress];

        delete validatorsData[msg.sender];

        emit ValidatorLeft(msg.sender);
    }

    function getValidatorData(address validator)
        public
        view
        returns (
            string memory name,
            bytes4 ipAddress,
            string memory website,
            bytes20 orbsAddress
        )
    {
        require(isValidator(validator), "Unlisted Validator");

        ValidatorData storage entry = validatorsData[validator];
        return (
            entry.name,
            entry.ipAddress,
            entry.website,
            entry.orbsAddress
        );
    }

    function getRegistrationBlockHeight(address validator)
        external
        view
        returns (uint registeredOn, uint lastUpdatedOn)
    {
        require(isValidator(validator), "Unlisted Validator");

        ValidatorData storage entry = validatorsData[validator];
        return (
            entry.registeredOnBlock,
            entry.lastUpdatedOnBlock
        );
    }

    function getOrbsAddress(address validator)
        public
        view
        returns (bytes20)
    {
        require(isValidator(validator), "Unlisted Validator");

        return validatorsData[validator].orbsAddress;
    }

    function isValidator(address addr) public view returns (bool) {
        return bytes(validatorsData[addr].name).length > 0;
    }
}
pragma solidity 0.5.3;


import "./IOrbsValidatorsRegistry.sol";


contract OrbsValidatorsRegistry is IOrbsValidatorsRegistry {

    // The validators metadata object.
    struct ValidatorData {
        string name;
        bytes4 ipAddress;
        string website;
        bytes20 orbsAddress;
        uint registeredOnBlock;
        uint lastUpdatedOnBlock;
    }

    // The version of the current validators metadata registration smart contract.
    uint public constant VERSION = 1;

    // A mapping between validator address and metadata.
    mapping(address => ValidatorData) internal validatorsData;

    // Lookups for IP Address & Orbs Address for uniqueness tests. Could be used for external lookups as well.
    mapping(bytes4 => address) public lookupByIp;
    mapping(bytes20 => address) public lookupByOrbsAddr;

    /// @dev register validator metadata.
    /// @param name string The name of the validator
    /// @param ipAddress bytes4 The validator node ip address
    /// @param website string The website of the validator
    /// @param orbsAddress bytes20 The validator node orbs public address
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
        require(!isValidator(msg.sender), "Validator already exists");
        require(ipAddress != bytes4(0), "Please pass a valid ip address represented as an array of exactly 4 bytes");
        require(orbsAddress != bytes20(0), "Please provide a valid Orbs Address");
        require(lookupByIp[ipAddress] == address(0), "IP address already in use");
        require(lookupByOrbsAddr[orbsAddress] == address(0), "Orbs Address is already in use by another validator");

        lookupByIp[ipAddress] = msg.sender;
        lookupByOrbsAddr[orbsAddress] = msg.sender;

        validatorsData[msg.sender] = ValidatorData(
            name,
            ipAddress,
            website,
            orbsAddress,
            block.number,
            block.number
        );

        emit ValidatorRegistered(msg.sender);
    }

    /// @dev update validator metadata. only msg.sender can update the validator details.
    /// @param name string The name of the validator
    /// @param ipAddress bytes4 The validator node ip address
    /// @param website string The website of the validator
    /// @param orbsAddress bytes20 The validator node orbs public address
    function update(
        string memory name,
        bytes4 ipAddress,
        string memory website,
        bytes20 orbsAddress
    )
        public
    {
        require(bytes(name).length > 0, "Please provide a valid name");
        require(bytes(website).length > 0, "Please provide a valid website");
        require(isValidator(msg.sender), "Validator doesnt exist");
        require(ipAddress != bytes4(0), "Please pass a valid ip address represented as an array of exactly 4 bytes");
        require(orbsAddress != bytes20(0), "Please provide a valid Orbs Address");
        require(isUniqueIp(ipAddress), "IP Address is already in use by another validator");
        require(isUniqueOrbsAddress(orbsAddress), "Orbs Address is already in use by another validator");

        ValidatorData storage data = validatorsData[msg.sender];

        delete lookupByIp[data.ipAddress];
        delete lookupByOrbsAddr[data.orbsAddress];

        lookupByIp[ipAddress] = msg.sender;
        lookupByOrbsAddr[orbsAddress] = msg.sender;

        data.name = name;
        data.ipAddress = ipAddress;
        data.website = website;
        data.orbsAddress = orbsAddress;
        data.lastUpdatedOnBlock = block.number;

        emit ValidatorUpdated(msg.sender);
    }

    /// @dev delete the validator metadata. only msg.sender can leave.
    function leave() public {
        require(isValidator(msg.sender), "Sender is not a listed Validator");

        ValidatorData storage data = validatorsData[msg.sender];

        delete lookupByIp[data.ipAddress];
        delete lookupByOrbsAddr[data.orbsAddress];

        delete validatorsData[msg.sender];

        emit ValidatorLeft(msg.sender);
    }

    /// @dev returns validator metadata.
    /// @param validator address address of the validator
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

    /// @dev Convenience method to check if you are a validator and what are your details.
    function reviewRegistration()
        public
        view
        returns (
            string memory name,
            bytes4 ipAddress,
            string memory website,
            bytes20 orbsAddress
        )
    {
        return getValidatorData(msg.sender);
    }

    /// @dev returns in which block the validator was registered and last updated.
    /// @param validator address address of the validator
    function getRegistrationBlockNumber(address validator)
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

    /// @dev returns the orbs node public address of a specific validator.
    /// @param validator address address of the validator
    function getOrbsAddress(address validator)
        public
        view
        returns (bytes20)
    {
        require(isValidator(validator), "Unlisted Validator");

        return validatorsData[validator].orbsAddress;
    }

    /// @dev returns if the address belongs to a validator
    /// @param addr address address of the validator
    function isValidator(address addr) public view returns (bool) {
        return validatorsData[addr].registeredOnBlock > 0;
    }

    /// @dev INTERNAL. Checks if the IP address is either unique Or belongs to the msg.sender
    /// @param ipAddress bytes4 ip address to check for uniqueness
    function isUniqueIp(bytes4 ipAddress) internal view returns (bool) {
        return
            lookupByIp[ipAddress] == address(0) ||
            lookupByIp[ipAddress] == msg.sender;
    }

    /// @dev INTERNAL. Checks if the Orbs node address is either unique Or belongs to the msg.sender
    /// @param orbsAddress bytes20 ip address to check for uniqueness
    function isUniqueOrbsAddress(bytes20 orbsAddress) internal view returns (bool) {
        return
            lookupByOrbsAddr[orbsAddress] == address(0) ||
            lookupByOrbsAddr[orbsAddress] == msg.sender;
    }

}
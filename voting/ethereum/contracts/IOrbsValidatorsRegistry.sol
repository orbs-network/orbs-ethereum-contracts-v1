pragma solidity 0.4.25;


interface IOrbsValidatorsRegistry {

    event ValidatorLeft(address indexed validator);
    event ValidatorRegistered(address indexed validator);
    event ValidatorUpdated(address indexed validator);

    /// @dev register a validator and provide registration data.
    /// the new validator entry will be owned and identified by msg.sender.
    /// if msg.sender is already registered as a validator in this registry the
    /// transaction will fail.
    /// @param name string The name of the validator
    /// @param ipAddress bytes4 The validator node ip address. If another validator previously registered this ipAddress the transaction will fail
    /// @param website string The website of the validator
    /// @param orbsAddress bytes20 The validator node orbs public address. If another validator previously registered this orbsAddress the transaction will fail
    function register(
        string name,
        bytes4 ipAddress,
        string website,
        bytes20 orbsAddress
    )
        external;

    /// @dev update the validator registration data entry associated with msg.sender.
    /// msg.sender must be registered in this registry contract.
    /// @param name string The name of the validator
    /// @param ipAddress bytes4 The validator node ip address. If another validator previously registered this ipAddress the transaction will fail
    /// @param website string The website of the validator
    /// @param orbsAddress bytes20 The validator node orbs public address. If another validator previously registered this orbsAddress the transaction will fail
    function update(
        string name,
        bytes4 ipAddress,
        string website,
        bytes20 orbsAddress
    )
        external;

    /// @dev deletes a validator registration entry associated with msg.sender.
    function leave() external;

    /// @dev returns validator registration data.
    /// @param validator address address of the validator.
    function getValidatorData(address validator)
        external
        view
        returns (
            string name,
            bytes4 ipAddress,
            string website,
            bytes20 orbsAddress
        );

    /// @dev returns the blocks in which a validator was registered and last updated.
    /// if validator does not designate a registered validator this method returns zero values.
    /// @param validator address of a validator
    function getRegistrationBlockNumber(address validator)
        external
        view
        returns (uint registeredOn, uint lastUpdatedOn);

    /// @dev Checks if validator is currently registered as a validator.
    /// @param validator address address of the validator
    /// @return true iff validator belongs to a registered validator
    function isValidator(address validator) external view returns (bool);

    /// @dev returns the orbs node public address of a specific validator.
    /// @param validator address address of the validator
    /// @return an Orbs node address
    function getOrbsAddress(address validator)
        external
        view
        returns (bytes20 orbsAddress);
}

pragma solidity 0.4.25;


interface IOrbsValidators {

    event ValidatorApproved(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    /// @dev Adds a validator to participate in network
    /// @param validator address The address of the validators.
    function approve(address validator) external;

    /// @dev Remove a validator from the List based on Guardians votes.
    /// @param validator address The address of the validators.
    function remove(address validator) external;

    /// @dev returns if an address belongs to the approved list & exists in the validators metadata registration database.
    /// @param validator address The address of the validators.
    function isValidator(address validator) external view returns (bool);

    /// @dev returns if an address belongs to the approved list
    /// @param validator address The address of the validators.
    function isApproved(address validator) external view returns (bool);

    /// @dev returns a list of all validators that have been approved and exist in the validator registration database.
    function getValidators() external view returns (address[]);

    /// @dev returns a list of all validators that have been approved and exist in the validator registration
    ///      database. same as getValidators but returns addresses represented as byte20.
    function getValidatorsBytes20() external view returns (bytes20[]);

    /// @dev returns the block number in which the validator was approved.
    /// @param validator address The address of the validators.
    function getApprovalBlockNumber(address validator)
        external
        view
        returns (uint);
}

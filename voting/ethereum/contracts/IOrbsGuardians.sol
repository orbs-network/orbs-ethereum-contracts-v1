pragma solidity 0.4.25;


interface IOrbsGuardians {

    event GuardianRegistered(address indexed guardian);
    event GuardianLeft(address indexed guardian);
    event GuardianUpdated(address indexed guardian);

    /// @dev register a new guardian. You will need to transfer registrationDepositWei amount of ether.
    /// @param name string The name of the guardian
    /// @param website string The website of the guardian
    function register(string name, string website) external payable;

    /// @dev update guardian details. only msg.sender can update it's own guardian details.
    /// @param name string The name of the guardian
    /// @param website string The website of the guardianfunction update(string name, string website) external;
    function update(string name, string website) external;

    /// @dev Delete the guardian and take back the locked ether. only msg.sender can leave.
    function leave() external;

    /// @dev Returns if the address belongs to a guardian
    /// @param guardian address the guardian address
    function isGuardian(address guardian) external view returns (bool);

    /// @dev Returns name and website for  a specific guardian.
    /// @param guardian address the guardian address
    function getGuardianData(address guardian)
        external
        view
        returns (string name, string website);

    /// @dev Convenience method to check if you are a guardian.
    function reviewRegistration()
        external
        view
        returns (string name, string website);

    /// @dev Returns in which block the guardian registered, and in which block it was last updated.
    /// @param guardian address the guardian address
    function getRegistrationBlockNumber(address guardian)
        external
        view
        returns (uint registeredOn, uint lastUpdatedOn);

    /// @dev Returns an array of guardians.
    /// @param offset uint offset from which to start getting guardians from the array
    /// @param limit uint limit of guardians to be returned.
    function getGuardians(uint offset, uint limit)
        external
        view
        returns (address[]);

    /// @dev Similar to getGuardians, but returns addresses represented as byte20.
    /// @param offset uint offset from which to start getting guardians from the array
    /// @param limit uint limit of guardians to be returned.
    function getGuardiansBytes20(uint offset, uint limit)
        external
        view
        returns (bytes20[]);
}

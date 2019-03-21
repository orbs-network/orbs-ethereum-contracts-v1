pragma solidity 0.5.3;


interface IOrbsGuardians {
    event GuardianRegistered(address indexed guardian);
    event GuardianLeft(address indexed guardian);
    event GuardianUpdated(address indexed guardian);

    function register(string calldata name, string calldata website)
        external
        payable;
    function update(string calldata name, string calldata website) external;
    function leave() external;
    function isGuardian(address guardian) external view returns (bool);
    function getGuardianData(address validator)
        external
        view
        returns (string memory name, string memory website);
    function reviewRegistration()
        external
        view
        returns (string memory name, string memory website);
    function getRegistrationBlockNumber(address guardian)
        external
        view
        returns (uint registeredOn, uint lastUpdatedOn);
    function getGuardians(uint offset, uint limit)
        external
        view
        returns (address[] memory);
    function getGuardiansBytes20(uint offset, uint limit)
        external
        view
        returns (bytes20[] memory);
}

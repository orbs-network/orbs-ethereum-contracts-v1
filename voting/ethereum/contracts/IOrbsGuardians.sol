pragma solidity 0.4.25;


interface IOrbsGuardians {
    event GuardianRegistered(address indexed guardian);
    event GuardianLeft(address indexed guardian);
    event GuardianUpdated(address indexed guardian);

    function register(string name, string website)
        external
        payable;
    function update(string name, string website) external;
    function leave() external;
    function isGuardian(address guardian) external view returns (bool);
    function getGuardianData(address validator)
        external
        view
        returns (string name, string website);
    function reviewRegistration()
        external
        view
        returns (string name, string website);
    function getRegistrationBlockNumber(address guardian)
        external
        view
        returns (uint registeredOn, uint lastUpdatedOn);
    function getGuardians(uint offset, uint limit)
        external
        view
        returns (address[]);
    function getGuardiansBytes20(uint offset, uint limit)
        external
        view
        returns (bytes20[]);
}

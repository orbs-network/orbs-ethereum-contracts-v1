pragma solidity 0.4.25;


interface IOrbsValidatorsRegistry {
    event ValidatorLeft(address indexed validator);
    event ValidatorRegistered(address indexed validator);
    event ValidatorUpdated(address indexed validator);

    function register(
        string name,
        bytes4 ipAddress,
        string website,
        bytes20 orbsAddress
    )
        external;
    function update(
        string name,
        bytes4 ipAddress,
        string website,
        bytes20 orbsAddress
    )
        external;
    function leave() external;
    function getValidatorData(address validator)
        external
        view
        returns (
            string name,
            bytes4 ipAddress,
            string website,
            bytes20 orbsAddress
        );
    function reviewRegistration()
        external
        view
        returns (
            string name,
            bytes4 ipAddress,
            string website,
            bytes20 orbsAddress
        );
    function getRegistrationBlockNumber(address validator)
        external
        view
        returns (uint registeredOn, uint lastUpdatedOn);
    function isValidator(address validator) external view returns (bool);
    function getOrbsAddress(address validator)
        external
        view
        returns (bytes20 orbsAddress);
}

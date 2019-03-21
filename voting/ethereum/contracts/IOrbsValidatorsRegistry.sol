pragma solidity 0.5.3;


interface IOrbsValidatorsRegistry {
    event ValidatorLeft(address indexed validator);
    event ValidatorRegistered(address indexed validator);

    function register(
        string calldata name,
        bytes4 ipAddress,
        string calldata website,
        bytes20 orbsAddress,
        bytes calldata declarationHash
    )
        external;
    function update(
        string calldata name,
        bytes4 ipAddress,
        string calldata website,
        bytes20 orbsAddress,
        bytes calldata declarationHash
    )
        external;
    function leave() external;
    function getValidatorData(address validator)
        external
        view
        returns (
            string memory name,
            bytes4 ipAddress,
            string memory website,
            bytes20 orbsAddress,
            bytes memory declarationHash
        );
    function reviewRegistration()
        external
        view
        returns (
            string memory name,
            bytes4 ipAddress,
            string memory website,
            bytes20 orbsAddress,
            bytes memory declarationHash
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

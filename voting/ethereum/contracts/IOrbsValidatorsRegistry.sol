pragma solidity 0.5.3;


interface IOrbsValidatorsRegistry {
    event ValidatorLeft(address indexed validator);
    event ValidatorRegistered(address indexed validator);

    function register(
        string calldata _name,
        bytes calldata _ipvAddress,
        string calldata _website,
        address _orbsAddress
    )
    external;
    function leave() external;
    function getValidatorData(address _validator)
    external
    view
    returns (
        string memory _name,
        bytes memory _ipvAddress,
        string memory _website,
        address _orbsAddress
    );

    function isValidator(address m) external view returns (bool);
    function getOrbsAddress(address _validator)
    external
    view
    returns (address _orbsAddress);
}

pragma solidity 0.5.3;


interface IOrbsValidators {
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    function addValidator(address _validator) external;
    function isValidator(address m) external view returns (bool);
    function getValidators() external view returns (bytes20[] memory validators);
}

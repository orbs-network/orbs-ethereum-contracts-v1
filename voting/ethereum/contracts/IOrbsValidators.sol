pragma solidity 0.4.25;


interface IOrbsValidators {
    event ValidatorApproved(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    function approve(address validator) external;
    function remove(address validator) external;
    function isValidator(address validator) external view returns (bool);
    function isApproved(address validator) external view returns (bool);
    function getValidators() external view returns (address[]);
    function getValidatorsBytes20() external view returns (bytes20[]);
    function getApprovalBlockNumber(address validator)
        external
        view
        returns (uint);
}

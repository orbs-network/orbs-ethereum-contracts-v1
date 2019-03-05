pragma solidity 0.5.3;


interface IOrbsGuardians {
    function register(string calldata _name, string calldata _website) external;
    function leave() external;
    function isGuardian(address _guardian) external view returns (bool);
    function getGuardianData(address _validator)
    external
    view
    returns (string memory name, string memory website);
    function getGuardians(uint offset, uint limit)
    external
    view
    returns (address[] memory);
}

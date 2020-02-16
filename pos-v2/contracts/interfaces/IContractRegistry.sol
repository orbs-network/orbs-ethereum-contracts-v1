pragma solidity 0.4.26;

interface IContractRegistry {

	/// @dev updates the contracts address and emits a corresponding event
	function set(string contractName, address addr) external /* onlyGovernor */;

	/// @dev returns the current address of the
	function get(string contractName) external view returns (address);
}

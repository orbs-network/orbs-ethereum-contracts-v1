pragma solidity 0.5.16;

interface IContractRegistry {

	event ContractAddressUpdated(string contractName, address addr);

	/// @dev updates the contracts address and emits a corresponding event
	function set(string calldata contractName, address addr) external /* onlyGovernor */;

	/// @dev returns the current address of the
	function get(string calldata contractName) external view returns (address);
}

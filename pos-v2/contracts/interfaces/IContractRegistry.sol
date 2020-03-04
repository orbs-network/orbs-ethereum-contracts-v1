pragma solidity 0.5.16;

interface IContractRegistry {
	event ContractSet(string contractName, address addr);

	/// @dev updates the contracts address and emits a corresponding event
	function setContractAddress(string calldata contractName, address addr) external /* onlyGovernor */;

	/// @dev returns the current address of the
	function getContractAddress(string calldata contractName) external view returns (address);
}

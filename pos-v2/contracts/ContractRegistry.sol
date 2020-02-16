pragma solidity 0.4.26;
import "./interfaces/IContractRegistry.sol";

contract ContractRegistry is IContractRegistry {

	address governor;

	mapping (string => address) contracts;

	event ContractAddressUpdated(string contractName, address addr);

	modifier onlyGovernor() {
		require(msg.sender == governor, "caller is the registry governor");

		_;
	}

	constructor(address _governor) public {
		governor = _governor;
	}

	function set(string contractName, address addr) external onlyGovernor {
		contracts[contractName] = addr;
		emit ContractAddressUpdated(contractName, addr);
	}

	function get(string contractName) external view returns (address) {
		return contracts[contractName];
	}
}

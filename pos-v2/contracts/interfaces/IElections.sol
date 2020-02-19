pragma solidity 0.5.16;

import "./IContractRegistry.sol";
import "./IStakeChangeNotifier.sol";

/// @title Elections contract interface
interface IElections /* is IStakeChangeNotifier */ {
	event ValidatorRegistered(address addr, bytes4 ip, address orbsAddr);
	event CommitteeChanged(address[] addrs, address[] orbsAddrs, uint256[] stakes);
	event TopologyChanged(address[] orbsAddrs, bytes4[] ips);
	event VotedOutEvent(address votedOut);
	event Delegated(address from, address to);
	event TotalStakeChanged(address addr, uint256 newTotal); // TODO - do we need this?

	/*
	 *   External methods
	 */

	/// @dev Called by a participant who wishes to register as a validator
	function registerValidator(bytes4 _ip, address _orbsAddress) external;

	/// @dev Called by a validator when ready to join the committee, typically after syncing is complete or after being voted out
	function notifyReadyForCommittee() external;

	/// @dev Stake delegation
	function delegate(address to) external;

	/// @dev Called by a validator as part of the automatic vote-out flow
	function voteOut(address addr) external;

	/// @dev Refreshes the staking information (and the corresponding rank in committee and topology) for the given addresses.
	function refreshStakes(address[] calldata addrs) external;

	/*
	 *   Methods restricted to other Orbs contracts
	 */

	/// @dev Called by: staking contract
	/// Notifies a batch of stake updates
	function stakeChangeBatch(address[] calldata _stakeOwners, uint256[] calldata _amounts, bool[] calldata _signs,
		uint256[] calldata _updatedStakes) external /* onlyStakingContract */;

	/// @dev Called by: staking contract
	/// Notifies an stake change event
	function stakeChange(address _stakeOwner, uint256 _amount, bool _sign, uint256 _updatedStake) external /* onlyStakingContract */;

	/// @dev Called by: staking contract
	/// Notifies an stake migration event
	function stakeMigration(address _stakeOwner, uint256 _amount) external /* onlyStakingContract */;

	/*
	 * Governance
	 */
	/// @dev Updates the address calldata of the contract registry
	function setContractRegistry(IContractRegistry _contractRegistry) external /* onlyOwner */;

	/*
	 *   Test helpers
	 */

	function getTopology() external view returns (address[] memory);
}

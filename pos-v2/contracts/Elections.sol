pragma solidity 0.4.26;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./IStakingListener.sol";
import "./ICommitteeListener.sol";

contract Elections is IStakingListener, Ownable {
	using SafeMath for uint256;

	event ValidatorRegistered(address addr, bytes4 ip);
	event CommitteeChanged(address[] addrs, address[] orbsAddrs, uint256[] stakes);
	event TopologyChanged(address[] orbsAddrs, bytes4[] ips);

	event Delegated(address from, address to);
	event TotalStakeChanged(address addr, uint256 newTotal); // TODO - do we need this?

	address[] topology;

	struct Validator {
		bytes4 ip;
		address orbsAddress;
	}

	mapping (address => Validator) registeredValidators;
	mapping (address => uint256) ownStakes;
	mapping (address => uint256) totalStakes;
	mapping (address => address) delegations;

	ICommitteeListener committeeListener;
	address stakingContract;

	uint minimumStake;
	uint maxCommitteeSize;
	uint maxTopologySize;

	modifier onlyStakingContract() {
		require(msg.sender == stakingContract, "caller is not the staking contract");

		_;
	}

	constructor(uint _maxCommitteeSize, uint _maxTopologySize, uint _minimumStake, ICommitteeListener _committeeListener) public {
		require(_maxTopologySize >= _maxCommitteeSize, "topology must be large enough to hold a full committee");
		require(_committeeListener != address(0), "committee listener should not be 0");
		require(_minimumStake > 0, "minimum stake for committee must be non-zero");

		minimumStake = _minimumStake;
		maxCommitteeSize = _maxCommitteeSize;
		committeeListener = _committeeListener;
		maxTopologySize = _maxTopologySize;
	}

	function getTopology() public view returns (address[]) {
		return topology;
	}

	function setStakingContract(address addr) public onlyOwner {
		require(addr != address(0), "Got staking contract address 0");
		stakingContract = addr;
	}

	function registerValidator(bytes4 _ip, address _orbsAddress) public  {
		require(registeredValidators[msg.sender].orbsAddress == address(0), "Validator is already registered");
		require(_orbsAddress != address(0), "orbs address must be non zero");

		registeredValidators[msg.sender].orbsAddress = _orbsAddress;
		registeredValidators[msg.sender].ip = _ip;
		emit ValidatorRegistered(msg.sender, _ip);

		_placeInTopology(msg.sender);
	}

	function delegate(address to) public {
		address prevDelegatee = delegations[msg.sender];
		uint256 stake = ownStakes[msg.sender];
		if (prevDelegatee != address(0)) {
			_updateTotalStake(prevDelegatee, totalStakes[prevDelegatee].sub(stake));
			_placeInTopology(prevDelegatee); // TODO may emit superfluous event
		}
		_updateTotalStake(to, totalStakes[to].add(stake));
		_placeInTopology(to);

		delegations[msg.sender] = to;

		emit Delegated(msg.sender, to);
	}

	function distributedStake(address[] stakeOwners, uint256[] amounts) external onlyStakingContract {
		require(stakeOwners.length == amounts.length);

		for (uint i = 0; i < stakeOwners.length; i++) {
			staked(stakeOwners[i], amounts[i]);
		}
	}

	function staked(address staker, uint256 amount) public onlyStakingContract {
		address delegatee = delegations[staker];
		if (delegatee == address(0)) {
			delegatee = staker;
		}
		_updateTotalStake(delegatee, totalStakes[delegatee].add(amount));
		ownStakes[staker] = ownStakes[staker].add(amount);

		_placeInTopology(delegatee);
	}

	function unstaked(address staker, uint256 amount) external onlyStakingContract {
		address delegatee = delegations[staker];
		if (delegatee == address(0)) {
			delegatee = staker;
		}
		_updateTotalStake(delegatee, totalStakes[delegatee].sub(amount));
		ownStakes[staker] = ownStakes[staker].sub(amount);

		_placeInTopology(delegatee);
	}

	function _satisfiesCommitteePrerequisites(address validator) private view returns (bool) {
		return registeredValidators[validator].orbsAddress != address(0) &&    // validator must be registered
		       minimumStake <= ownStakes[validator]; // validator must hold the minimum required stake
	}

	function _isQualifiedByRank(address validator) private view returns (bool) {
		return topology.length < maxTopologySize || // committee is not full
				totalStakes[validator] > totalStakes[topology[topology.length-1]]; // validator has more stake the the bottom committee validator
	}

	function _loadStakes(uint limit) private view returns (uint256[]) {
		assert(limit <= maxTopologySize);
		uint256[] memory stakes = new uint256[](limit);
		for (uint i=0; i < limit && i < topology.length; i++) {
			stakes[i] = totalStakes[topology[i]];
		}
		return stakes;
	}

	function _loadTopologyStakes() private view returns (uint256[]) {
		return _loadStakes(maxTopologySize);
	}

	function _loadCommitteeStakes() private view returns (uint256[]) {
		return _loadStakes(maxCommitteeSize);
	}

	function _removeFromTopology(uint p) private {
		assert(topology.length > 0);
		assert(p < topology.length);

		bool inCommittee = p < maxCommitteeSize;

		for (;p < topology.length - 1; p++) {
			topology[p] = topology[p + 1];
		}
		topology.length = topology.length - 1;

		if (inCommittee) {
			_onCommitteeChanged(_loadCommitteeStakes());
		}
		_onTopologyChanged();
	}

	function _onTopologyChanged() private {
		assert(topology.length <= maxTopologySize);
		address[] memory topologyOrbsAddresses = new address[](topology.length);
		bytes4[] memory ips = new bytes4[](topology.length);

		for (uint i = 0; i < topologyOrbsAddresses.length; i++) {
			Validator storage val = registeredValidators[topology[i]];
			topologyOrbsAddresses[i] = val.orbsAddress;
			ips[i] = val.ip;
		}
		emit TopologyChanged(topologyOrbsAddresses, ips);
	}

	function _onCommitteeChanged(uint256[] memory stakes) private {
		assert(topology.length <= maxTopologySize);

		uint committeeSize = Math.min(maxCommitteeSize, topology.length);
		assert(stakes.length >= committeeSize); // we only take the first committeeSize items from the stakes array (an optimization)

		uint256[] memory committeeStakes = new uint256[](committeeSize);
		address[] memory committeeOrbsAddresses = new address[](committeeSize);
		address[] memory committeeAddresses = new address[](committeeSize);

		for (uint i = 0; i < committeeSize; i++) {
			Validator storage val = registeredValidators[topology[i]];
			committeeOrbsAddresses[i] = val.orbsAddress;
			committeeAddresses[i] = topology[i];
			committeeStakes[i] = stakes[i];
		}
		committeeListener.committeeChanged(committeeAddresses, committeeStakes);
		emit CommitteeChanged(committeeAddresses, committeeOrbsAddresses, committeeStakes);
	}

	function _placeInTopology(address validator) private {
		(uint p, bool inCurrentTopology) = _findInTopology(validator);

		if (!_satisfiesCommitteePrerequisites(validator)) {
			if (inCurrentTopology) {
				_removeFromTopology(p);
			}
			return;
		}

		if (!inCurrentTopology && !_isQualifiedByRank(validator)) {
			return;
		}

		if (!inCurrentTopology) {
			if (topology.length == maxTopologySize) {
				p = topology.length - 1;
				topology[p] = validator;
			} else {
				p = topology.push(validator) - 1;
			}
		}
		_sortTopologyMember(p);
		if (!inCurrentTopology) {
			_onTopologyChanged();
		}
	}

	function _sortTopologyMember(uint memberPos) private {
		assert(topology.length > memberPos);

		uint256[] memory stakes = _loadTopologyStakes();

		uint origPos = memberPos;

		while (memberPos > 0 && stakes[memberPos] > stakes[memberPos-1]) {
			_replace(stakes, memberPos-1, memberPos);
			memberPos--;
		}

		while (memberPos < stakes.length - 1 && stakes[memberPos] < stakes[memberPos+1]) {
			_replace(stakes, memberPos, memberPos+1);
			memberPos++;
		}

		if (origPos < maxCommitteeSize || memberPos < maxCommitteeSize) {
			_onCommitteeChanged(stakes);
		}
	}

	function _replace(uint256[] memory stakes, uint p1, uint p2) private {
		uint tempStake = stakes[p1];
		address tempValidator = topology[p1];

		stakes[p1] = stakes[p2];
		topology[p1] = topology[p2];

		stakes[p2] = tempStake;
		topology[p2] = tempValidator;
	}

	function _append(address stakeOwner) private returns (uint, bool) {
		(uint p, bool found) = _findInTopology(stakeOwner);

		if (found) {
			return (p, true);
		}

		if (topology.length == maxTopologySize) { // a full committee
			bool qualifyToEnter = totalStakes[stakeOwner] > totalStakes[topology[topology.length-1]];
			if (!qualifyToEnter) {
				return (0, false);
			}
			p = topology.length - 1;
			topology[p] = stakeOwner; // replace last member
		} else {
			p = topology.push(stakeOwner) - 1; // extend committee
		}
		return (p, true);
	}

	function _updateTotalStake(address addr, uint256 newTotal) private {
		totalStakes[addr] = newTotal;
		emit TotalStakeChanged(addr, newTotal);
	}

	function _findInTopology(address v) private view returns (uint, bool) {
		uint l =  topology.length;
		for (uint i=0; i < l; i++) {
			if (topology[i] == v) {
				return (i, true);
			}
		}
		return (0, false);
	}


}

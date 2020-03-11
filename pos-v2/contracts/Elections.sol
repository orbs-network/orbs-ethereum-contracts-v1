pragma solidity 0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

import "./interfaces/ICommitteeListener.sol";
import "./interfaces/IElections.sol";
import "./interfaces/IContractRegistry.sol";
import "./IStakingContract.sol";

contract Elections is IElections, IStakeChangeNotifier, Ownable {
	using SafeMath for uint256;

	IContractRegistry contractRegistry;

	event Debug(string,uint256);

    uint256 constant BANNING_LOCK_TIMEOUT = 1 weeks;

	address[] topology;

	struct Validator {
		bool registered;
		bytes4 ip;
		address orbsAddress;
	}

	// TODO consider using structs instead of multiple mappings
	mapping (address => Validator) registeredValidators;
	mapping (address => bool) readyValidators; // TODO if out-of-topology validators cannot be be ready-for-committee, this mapping can be replaced by a single uint

	mapping (address => uint256) ownStakes;
	mapping (address => uint256) uncappedStakes;
	uint256 totalGovernanceStake;

	mapping (address => address) delegations;
	mapping (address => mapping (address => uint256)) voteOuts; // by => to => timestamp
	mapping (address => address[]) banningVotes; // by => to[]]
	mapping (address => uint256) accumulatedStakesForBanning; // addr => total stake
	mapping (address => address) orbsAddressToMainAddress;
	mapping (address => uint256) bannedValidators; // addr => timestamp

	uint committeeSize; // TODO may be redundant if readyValidators mapping is present

	uint minimumStake;
	uint maxCommitteeSize;
	uint maxTopologySize;
	uint maxDelegationRatio; // TODO consider using a hardcoded constant instead.
	uint8 voteOutPercentageThreshold;
	uint256 voteOutTimeoutSeconds;
	uint256 banningPercentageThreshold;

	modifier onlyStakingContract() {
		require(msg.sender == contractRegistry.get("staking"), "caller is not the staking contract");

		_;
	}

	constructor(uint _maxCommitteeSize, uint _maxTopologySize, uint _minimumStake /* TODO remove, feature not needed */, uint8 _maxDelegationRatio, uint8 _voteOutPercentageThreshold, uint256 _voteOutTimeoutSeconds, uint256 _banningPercentageThreshold) public {
		require(_maxCommitteeSize > 0, "maxCommitteeSize must be larger than 0");
		require(_maxTopologySize > _maxCommitteeSize, "topology must be larger than a full committee");
		require(_maxDelegationRatio >= 1, "max delegation ration must be at least 1");
		require(_voteOutPercentageThreshold >= 0 && _voteOutPercentageThreshold <= 100, "voteOutPercentageThreshold must be between 0 and 100");
		require(_banningPercentageThreshold >= 0 && _banningPercentageThreshold <= 100, "banningPercentageThreshold must be between 0 and 100");

		minimumStake = _minimumStake;
		maxCommitteeSize = _maxCommitteeSize;
		maxTopologySize = _maxTopologySize;
	    maxDelegationRatio = _maxDelegationRatio;
		voteOutPercentageThreshold = _voteOutPercentageThreshold;
		voteOutTimeoutSeconds = _voteOutTimeoutSeconds;
		banningPercentageThreshold = _banningPercentageThreshold;
	}

	function setContractRegistry(IContractRegistry _contractRegistry) external onlyOwner {
		require(_contractRegistry != IContractRegistry(0), "contractRegistry must not be 0");
		contractRegistry = _contractRegistry;
	}

	function getTopology() external view returns (address[] memory) {
		return topology;
	}

	function registerValidator(bytes4 _ip, address _orbsAddress) external  {
		require(registeredValidators[msg.sender].registered == false, "Validator is already registered");
		require(_orbsAddress != address(0), "orbs address must be non zero");

		registeredValidators[msg.sender] =  Validator({
			registered: true,
			orbsAddress: _orbsAddress,
			ip: _ip
		});

		orbsAddressToMainAddress[_orbsAddress] = msg.sender;
		emit ValidatorRegistered(msg.sender, _ip, _orbsAddress);

		_rankValidator(msg.sender);
	}

	function setValidatorIp(bytes4 ip) external {
		require(registeredValidators[msg.sender].registered, "Validator is not registered");
		registeredValidators[msg.sender].ip = ip;
		(, bool isInTopology) = _findInTopology(msg.sender);
		if (isInTopology) {
			_notifyTopologyChanged();
		}
	}

	function setValidatorOrbsAddress(address orbsAddress) external {
		require(registeredValidators[msg.sender].registered, "Validator is not registered");
		registeredValidators[msg.sender].orbsAddress = orbsAddress;
		(uint pos, bool isInTopology) = _findInTopology(msg.sender);
		if (isInTopology) {
			_notifyTopologyChanged();
			if (pos < committeeSize) {
				_notifyCommitteeChanged();
			}
		}
	}

	function notifyReadyForCommittee() external {
		address sender = getMainAddrFromOrbsAddr(msg.sender);
		readyValidators[sender] = true;
		_rankValidator(sender);
	}

	function delegate(address to) external {
		address prevDelegatee = delegations[msg.sender];
        if (prevDelegatee == address(0)) {
            prevDelegatee = msg.sender;
        }

		uint256 prevGovStakePrevDelegatee = getGovernanceEffectiveStake(prevDelegatee);
		uint256 prevGovStakeNewDelegatee = getGovernanceEffectiveStake(to);

		delegations[msg.sender] = to; // delegation!
		emit Delegated(msg.sender, to);

		uint256 stake = ownStakes[msg.sender];

        _applyDelegatedStake(prevDelegatee, uncappedStakes[prevDelegatee].sub(stake), prevGovStakePrevDelegatee);
		_applyDelegatedStake(to, uncappedStakes[to].add(stake), prevGovStakeNewDelegatee);

		_applyStakesToBanningBy(prevDelegatee, prevGovStakePrevDelegatee);
		_applyStakesToBanningBy(to, prevGovStakeNewDelegatee);
	}

	function voteOut(address addr) external {
		address sender = getMainAddrFromOrbsAddr(msg.sender);
		uint256 totalCommitteeStake = 0;
		uint256 totalVoteOutStake = 0;

		voteOuts[sender][addr] = now;
		for (uint i = 0; i < committeeSize; i++) {
			address member = topology[i];
			uint256 memberStake = getCommitteeEffectiveStake(member);

			totalCommitteeStake = totalCommitteeStake.add(memberStake);
			uint256 votedAt = voteOuts[member][addr];
			if (votedAt != 0 && now.sub(votedAt) < voteOutTimeoutSeconds) {
				totalVoteOutStake = totalVoteOutStake.add(memberStake);
			}
			// TODO - consider clearing up stale votes from the state (gas efficiency)
		}

		emit VoteOut(sender, addr);

		if (totalCommitteeStake > 0 && totalVoteOutStake.mul(100).div(totalCommitteeStake) >= voteOutPercentageThreshold) {
			for (uint i = 0; i < committeeSize; i++) {
				voteOuts[topology[i]][addr] = 0; // clear vote-outs
			}
			readyValidators[addr] = false;
			_rankValidator(addr);

			emit VotedOutOfCommittee(addr);
		}

	}

	function setBanningVotes(address[] calldata validators) external {
		require(validators.length <= 3, "up to 3 concurrent votes are supported");
		for (uint i = 0; i < validators.length; i++) {
			require(validators[i] != address(0), "all votes must non zero addresses");
			// TODO - uncomment?
			//require(registeredValidators[validators[i]].registered, "all votes must be of registered validators");
		}
        _setBanningVotes(msg.sender, validators);
		emit BanningVote(msg.sender, validators);
	}

	function getTotalGovernanceStake() external view returns (uint256) {
		return totalGovernanceStake;
	}

	function getBanningVotes(address addrs) external view returns (address[] memory) {
		return banningVotes[addrs];
	}

	function getAccumulatedStakesForBanning(address addrs) external view returns (uint256) {
		return accumulatedStakesForBanning[addrs];
	}

	function _applyStakesToBanningBy(address voter, uint256 previousStake) private {
		address[] memory votes = banningVotes[voter];
		uint256 currentStake = getGovernanceEffectiveStake(voter);

		for (uint i = 0; i < votes.length; i++) {
			address validator = votes[i];
			accumulatedStakesForBanning[validator] = accumulatedStakesForBanning[validator].
				sub(previousStake).
				add(currentStake);
			_applyBanningVotesFor(validator);
		}
	}

    function _setBanningVotes(address voter, address[] memory validators) private {
		address[] memory prevAddrs = banningVotes[voter];
		banningVotes[voter] = validators;

		for (uint i = 0; i < prevAddrs.length; i++) {
			address addr = prevAddrs[i];
			bool isRemoved = true;
			for (uint j = 0; j < validators.length; j++) {
				if (addr == validators[j]) {
					isRemoved = false;
					break;
				}
			}
			if (isRemoved) {
				accumulatedStakesForBanning[addr] = accumulatedStakesForBanning[addr].sub(getGovernanceEffectiveStake(msg.sender));
				_applyBanningVotesFor(addr);
			}
		}

		for (uint i = 0; i < validators.length; i++) {
			address addr = validators[i];
			bool isAdded = true;
			for (uint j = 0; j < prevAddrs.length; j++) {
				if (prevAddrs[j] == addr) {
					isAdded = false;
					break;
				}
			}
			if (isAdded) {
				accumulatedStakesForBanning[addr] = accumulatedStakesForBanning[addr].add(getGovernanceEffectiveStake(msg.sender));
			}
			_applyBanningVotesFor(addr); // recheck also if not new
		}
    }

    function _applyBanningVotesFor(address addr) private {
        uint256 banningTimestamp = bannedValidators[addr];
        bool isBanned = banningTimestamp != 0;

        if (isBanned && now.sub(banningTimestamp) >= BANNING_LOCK_TIMEOUT) { // no unbanning after 7 days
            return;
        }

        uint256 banningStake = accumulatedStakesForBanning[addr];

        bool shouldBan = totalGovernanceStake > 0 && banningStake.mul(100).div(totalGovernanceStake) >= banningPercentageThreshold;

        if (isBanned != shouldBan) {
			if (shouldBan) {
                bannedValidators[addr] = now;
				emit Banned(addr);
			} else {
                bannedValidators[addr] = 0;
				emit Unbanned(addr);
			}
            _rankValidator(addr);
        }
    }

    function stakeChangeBatch(address[] calldata _stakeOwners, uint256[] calldata _amounts, bool[] calldata _signs,
		uint256[] calldata _updatedStakes) external onlyStakingContract {
		require(_stakeOwners.length == _amounts.length, "_stakeOwners, _amounts - array length mismatch");
		require(_stakeOwners.length == _signs.length, "_stakeOwners, _signs - array length mismatch");
		require(_stakeOwners.length == _updatedStakes.length, "_stakeOwners, _updatedStakes - array length mismatch");

		for (uint i = 0; i < _stakeOwners.length; i++) {
			_stakeChange(_stakeOwners[i], _amounts[i], _signs[i], _updatedStakes[i]);
		}
	}

	function getDelegation(address delegator) external view returns (address) {
		if (_isSelfDelegating(delegator)) {
			return delegator;
		}
		return delegations[delegator];
	}

	function stakeChange(address _stakeOwner, uint256 _amount, bool _sign, uint256 _updatedStake) external onlyStakingContract {
		_stakeChange(_stakeOwner, _amount, _sign, _updatedStake);
	}

	function _stakeChange(address _stakeOwner, uint256 _amount, bool _sign, uint256 /* _updatedStake */) private {
		address delegatee = delegations[_stakeOwner];
		if (delegatee == address(0)) {
			delegatee = _stakeOwner;
		}

		uint256 prevGovStakeOwner = getGovernanceEffectiveStake(_stakeOwner);
		uint256 prevGovStakeDelegatee = getGovernanceEffectiveStake(delegatee);

		uint256 newUncappedStake;
		uint256 newOwnStake;
		if (_sign) {
			newOwnStake = ownStakes[_stakeOwner].add(_amount);
			newUncappedStake = uncappedStakes[delegatee].add(_amount);
		} else {
			newOwnStake = ownStakes[_stakeOwner].sub(_amount);
			newUncappedStake = uncappedStakes[delegatee].sub(_amount);
		}
		ownStakes[_stakeOwner] = newOwnStake;

		_applyDelegatedStake(delegatee, newUncappedStake, prevGovStakeDelegatee);

		_applyStakesToBanningBy(_stakeOwner, prevGovStakeOwner); // totalGovernanceStake must be updated by now
		_applyStakesToBanningBy(delegatee, prevGovStakeDelegatee); // totalGovernanceStake must be updated by now
	}

	function stakeMigration(address _stakeOwner, uint256 _amount) external onlyStakingContract {}

	function refreshStakes(address[] calldata addrs) external {
		IStakingContract staking = IStakingContract(contractRegistry.get("staking"));

		for (uint i = 0; i < addrs.length; i++) {
			address staker = addrs[i];
			uint256 newOwnStake = staking.getStakeBalanceOf(staker);
			uint256 oldOwnStake = ownStakes[staker];
			if (newOwnStake > oldOwnStake) {
				_stakeChange(staker, newOwnStake - oldOwnStake, true, newOwnStake);
			} else if (oldOwnStake > newOwnStake) {
				_stakeChange(staker, oldOwnStake - newOwnStake, false, newOwnStake);
			}
		}
	}

	function getMainAddrFromOrbsAddr(address orbsAddr) private view returns (address) {
		address sender = orbsAddressToMainAddress[orbsAddr];
		require(sender != address(0), "unknown orbs address");
		return sender;
	}

	// TODO what is the requirement? should an absolute minimum stake be enforced?
	function _holdsMinimumStake(address validator) private view returns (bool) {
		return minimumStake <= ownStakes[validator] && // validator must hold the minimum required stake (own)
		       minimumStake <= getCommitteeEffectiveStake(validator); // validator must hold the minimum required stake (effective)
	}

	function _isSelfDelegating(address validator) private view returns (bool) {
		return delegations[validator] == address(0) || delegations[validator] == validator;
	}

	function _satisfiesTopologyPrerequisites(address validator) private view returns (bool) {
		bool isBanned = bannedValidators[validator] != 0;
        return registeredValidators[validator].orbsAddress != address(0) &&    // validator must be registered
			   !isBanned &&
			   _isSelfDelegating(validator) &&
		       _holdsMinimumStake(validator);
	}

	function _isQualifiedForTopologyByRank(address validator) private view returns (bool) {
		// this assumes maxTopologySize > maxCommitteeSize, otherwise a non ready-for-committee validator may override one that is ready.
		return topology.length < maxTopologySize || // topology is not full
				getCommitteeEffectiveStake(validator) > getCommitteeEffectiveStake(topology[topology.length-1]); // validator has more stake the the bottom topology validator
	}

	function _loadStakes(uint limit) private view returns (uint256[] memory) {
		assert(limit <= maxTopologySize);
		if (limit > topology.length) {
			limit = topology.length;
		}
		uint256[] memory stakes = new uint256[](limit);
		for (uint i=0; i < limit && i < topology.length; i++) {
			stakes[i] = getCommitteeEffectiveStake(topology[i]);
		}
		return stakes;
	}

	function _loadTopologyStakes() private view returns (uint256[] memory) {
		return _loadStakes(maxTopologySize);
	}

	function _loadCommitteeStakes() private view returns (uint256[] memory) {
		return _loadStakes(committeeSize);
	}

	function _notifyTopologyChanged() private {
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

	function _notifyCommitteeChanged() private {
		uint256[] memory committeeStakes = _loadCommitteeStakes();
		address[] memory committeeOrbsAddresses = new address[](committeeStakes.length);
		address[] memory committeeAddresses = new address[](committeeStakes.length);
		for (uint i = 0; i < committeeStakes.length; i++) {
			Validator storage val = registeredValidators[topology[i]];
			committeeOrbsAddresses[i] = val.orbsAddress;
			committeeAddresses[i] = topology[i];
		}
		ICommitteeListener committeeListener = ICommitteeListener(contractRegistry.get("rewards"));
		committeeListener.committeeChanged(committeeAddresses, committeeStakes);
		emit CommitteeChanged(committeeAddresses, committeeOrbsAddresses, committeeStakes);
	}

	function _refreshCommitteeSize() private returns (uint, uint) {
		uint newSize = committeeSize;
		uint prevSize = newSize;
		while (newSize > 0 && (topology.length < newSize || !readyValidators[topology[newSize - 1]])) {
			newSize--;
		}
		while (topology.length > newSize && readyValidators[topology[newSize]] && newSize < maxCommitteeSize){
			newSize++;
		}
		committeeSize = newSize;
		return (prevSize, newSize);
	}

	function _removeFromTopology(uint pos) private {
		assert(topology.length > 0);
		assert(pos < topology.length);

		for (uint p = pos; p < topology.length - 1; p++) {
			topology[p] = topology[p + 1];
		}

		topology.length = topology.length - 1;
		(uint prevSize, uint currentSize) = _refreshCommitteeSize();

		if (prevSize != currentSize || pos < currentSize) {
			_notifyCommitteeChanged();
		}

		_notifyTopologyChanged();
	}

	function _appendToTopology(address validator) private {
		uint pos = topology.length - 1; // current last

		if (topology.length < maxTopologySize) { // extend topology
			topology.length++;
			pos++;
		}

		topology[pos] = validator;

		pos = _repositionTopologyMember(pos);
		(uint prevSize, uint currentSize) = _refreshCommitteeSize();

		if (prevSize != currentSize || pos < currentSize) {
			_notifyCommitteeChanged();
		}

		_notifyTopologyChanged();
	}

	function _adjustPositionInTopology(uint pos) private {
		uint newPos = _repositionTopologyMember(pos);
		(uint prevSize, uint currentSize) = _refreshCommitteeSize();

		if (prevSize != currentSize || pos < currentSize || newPos < currentSize) {
			_notifyCommitteeChanged();
		}
	}

	function _rankValidator(address validator) private {
		(uint pos, bool inTopology) = _findInTopology(validator);

		if (inTopology && !_satisfiesTopologyPrerequisites(validator)) {
			_removeFromTopology(pos);
			return;
		}

		if (inTopology) {
			_adjustPositionInTopology(pos);
			return;
		}

		if (_satisfiesTopologyPrerequisites(validator) && _isQualifiedForTopologyByRank(validator)) {
			_appendToTopology(validator);
			return;
		}
	}

	function _compareValidators(uint v1pos, uint v2pos) private view returns (int) {
		address v1 = topology[v1pos];
		bool v1Ready = readyValidators[v1];
		uint256 v1Stake = getCommitteeEffectiveStake(v1);
		address v2 = topology[v2pos];
		bool v2Ready = readyValidators[v2];
		uint256 v2Stake = getCommitteeEffectiveStake(v2);
		return v1Ready && !v2Ready || v1Ready == v2Ready && v1Stake > v2Stake ? int(1) : -1;
	}

	function _repositionTopologyMember(uint memberPos) private returns (uint) {
        uint topologySize = topology.length;
		assert(topologySize > memberPos);

		while (memberPos > 0 && _compareValidators(memberPos, memberPos - 1) > 0) {
			_replace(memberPos-1, memberPos);
			memberPos--;
		}

		while (memberPos < topologySize - 1 && _compareValidators(memberPos, memberPos + 1) < 0) {
			_replace(memberPos, memberPos+1);
			memberPos++;
		}

		return memberPos;
	}

	function _replace(uint p1, uint p2) private {
		address tempValidator = topology[p1];
		topology[p1] = topology[p2];
		topology[p2] = tempValidator;
	}

	function _applyDelegatedStake(address addr, uint256 newStake, uint256 prevGovStake) private {
		uncappedStakes[addr] = newStake;

		uint256 currentGovStake = getGovernanceEffectiveStake(addr);
		totalGovernanceStake = totalGovernanceStake.sub(prevGovStake).add(currentGovStake);

		emit StakeChanged(addr, ownStakes[addr], newStake, getGovernanceEffectiveStake(addr), getCommitteeEffectiveStake(addr), totalGovernanceStake);

		_rankValidator(addr);
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

	function getCommitteeEffectiveStake(address v) private view returns (uint256) {
		uint256 ownStake = ownStakes[v];
		if (!_isSelfDelegating(v) || ownStake == 0) {
			return 0;
		}

		uint256 uncappedStake = uncappedStakes[v];
		uint256 maxRatio = maxDelegationRatio;
		if (uncappedStake.div(ownStake) < maxRatio) {
			return uncappedStake;
		}
		return ownStake.mul(maxRatio); // never overflows
	}

	function getGovernanceEffectiveStake(address v) public view returns (uint256) {
		if (!_isSelfDelegating(v)) {
			return 0;
		}
		return uncappedStakes[v];
	}

}

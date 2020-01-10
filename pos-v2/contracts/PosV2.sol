pragma solidity 0.4.26;

import "./IStakingListener.sol";

contract PosV2 is IStakingListener {

	event ValidatorRegistered(address addr, bytes4 ip);
	event CommitteeChanged(address[] addrs, uint256[] stakes);

	address[] committee;
	mapping (address => bool) registeredValidators;
	mapping (address => uint256) validatorsStake;

	uint maxCommitteeSize;

	constructor(uint _maxCommitteeSize) public {
		maxCommitteeSize = _maxCommitteeSize;
	}

	function registerValidator(bytes4 ip) public  {
		require(registeredValidators[msg.sender] == false, "Validator is already registered");

		registeredValidators[msg.sender] = true;
		emit ValidatorRegistered(msg.sender, ip);

		_placeInCommittee(msg.sender);
	}

	function staked(address stakeOwner, uint256 /* amount */, uint256 totalStakedAmount) external {
		validatorsStake[stakeOwner] = totalStakedAmount;
		_placeInCommittee(stakeOwner);
	}

	function unstaked(address stakeOwner, uint256 /* amount */, uint256 totalStakedAmount) external {
		validatorsStake[stakeOwner] = totalStakedAmount;
		_placeInCommittee(stakeOwner);
	}

	function _placeInCommittee(address stakeOwner) private {

		(uint p, bool qualifies) = _qualifyAndAppend(stakeOwner);
		if (!qualifies) {
			return;
		}

		uint256[] memory stakes = new uint256[](committee.length);
		for (uint i=0; i<committee.length; i++) {
			stakes[i] = validatorsStake[committee[i]];
		}

		while (p > 0 && stakes[p] > stakes[p-1]) {
			_replace(stakes, p-1, p);
			p--;
		}

		while (p < stakes.length - 1 && stakes[p] < stakes[p+1]) {
			_replace(stakes, p, p+1);
			p++;
		}

		emit CommitteeChanged(committee, stakes);
	}

	function _replace(uint256[] memory stakes, uint p1, uint p2) private {
		uint tempStake = stakes[p1];
		address tempValidator = committee[p1];

		stakes[p1] = stakes[p2];
		committee[p1] = committee[p2];

		stakes[p2] = tempStake;
		committee[p2] = tempValidator;
	}

	function _qualifyAndAppend(address stakeOwner) private returns (uint, bool) {
		(uint p, bool found) = _findInCommittee(stakeOwner);

		if (found) {
			return (p, true);
		}

		if (!registeredValidators[stakeOwner]) {
			return (0, false);
		}

		bool fullCommittee = committee.length == maxCommitteeSize;

		if (fullCommittee) {
			bool qualifies = validatorsStake[stakeOwner] > validatorsStake[committee[committee.length-1]];
			if (!qualifies) {
				return (0, false); // no qualification
			}
			p = committee.length - 1;
			committee[p] = stakeOwner; // replace last member
		} else {
			p = committee.push(stakeOwner) - 1; // extend committee
		}
		return (p, true);
	}

	function _findInCommittee(address v) private view returns (uint, bool) {
		uint l =  committee.length;
		for (uint i=0; i < l; i++) {
			if (committee[i] == v) {
				return (i, true);
			}
		}
		return (0, false);
	}
}

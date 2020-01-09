pragma solidity 0.4.26;

import "./IStakingListener.sol";

contract PosV2 is IStakingListener {

	address[] committee;
	mapping (address => bool) registeredValidators;
	mapping (address => uint256) validatorsStake;

	event ValidatorRegistered(address addr, bytes4 ip);
	event CommitteeChanged(address[] addrs, uint256[] stakes);

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

		(uint pos, bool exists) = _getPos(stakeOwner);
		if (!exists) {
			if (!registeredValidators[stakeOwner]) { // not adding if not registered
				return;
			}
			pos = committee.push(stakeOwner) - 1;
		}

		uint256[] memory stakes = new uint256[](committee.length);
		for (uint i=0; i<committee.length; i++) {
			stakes[i] = validatorsStake[committee[i]];
		}

		while (pos > 0 && stakes[pos] > stakes[pos-1]) {
			_replace(stakes, pos-1, pos);
			pos--;
		}

		while (pos < stakes.length - 1 && stakes[pos] < stakes[pos+1]) {
			_replace(stakes, pos, pos+1);
			pos++;
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

	function _getPos(address v) private view returns (uint, bool) {
		uint l =  committee.length;
		for (uint i=0; i < l; i++) {
			if (committee[i] == v) {
				return (i, true);
			}
		}
		return (0, false);
	}
}

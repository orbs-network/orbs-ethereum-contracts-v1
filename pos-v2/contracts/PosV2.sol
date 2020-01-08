pragma solidity 0.4.26;

import "./IStakingListener.sol";

contract PosV2 is IStakingListener {

	address[] committee;
	mapping (address => bool) registeredValidators;
	mapping (address => uint256) validatorsStake;

	event ValidatorRegistered(address addr, bytes4 ip);
	event CommitteeEvent(address[] addrs, uint256[] stakes);

	function registerValidator(bytes4 ip) public  {
		if (registeredValidators[msg.sender]) {
			return;
		}
		registeredValidators[msg.sender] = true;
		emit ValidatorRegistered(msg.sender, ip);

		committee.push(msg.sender);
		uint256[] memory stakes = new uint256[](committee.length);
		for (uint i=0; i<committee.length; i++) {
			stakes[i] = validatorsStake[committee[i]];
		}
		emit CommitteeEvent(committee, stakes);
	}

	function staked(address stakeOwner, uint256 /* amount */, uint256 totalStakedAmount) external {
		validatorsStake[stakeOwner] = totalStakedAmount;
	}

	function unstaked(address stakeOwner, uint256 /* amount */, uint256 totalStakedAmount) external {
		validatorsStake[stakeOwner] = totalStakedAmount;
	}

}

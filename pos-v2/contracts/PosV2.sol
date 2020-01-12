pragma solidity 0.4.26;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "./IStakingListener.sol";

contract PosV2 is IStakingListener, Ownable {
	using SafeMath for uint256;

	event ValidatorRegistered(address addr, bytes4 ip);
	event CommitteeChanged(address[] addrs, uint256[] stakes);
	event Delegated(address from, address to);

	address[] committee;
	mapping (address => bool) registeredValidators;
	mapping (address => uint256) ownStakes;
	mapping (address => uint256) totalStakes;
	mapping (address => address) delegations;

	address _stakingContract;

	uint maxCommitteeSize;

	modifier onlyStakingContract() {
		require(msg.sender == _stakingContract, "caller is not the staking contract");

		_;
	}

	constructor(uint _maxCommitteeSize) public {
		maxCommitteeSize = _maxCommitteeSize;
	}

	function setStakingContract(address addr) public onlyOwner {
		require(addr != 0, "Got staking contract address 0");
		_stakingContract = addr;
	}

	function registerValidator(bytes4 ip) public  {
		require(registeredValidators[msg.sender] == false, "Validator is already registered");

		registeredValidators[msg.sender] = true;
		emit ValidatorRegistered(msg.sender, ip);

		_placeInCommittee(msg.sender);
	}

	function delegate(address to) public {
		address prevDelegatee = delegations[msg.sender];
		uint256 stake = ownStakes[msg.sender];
		if (prevDelegatee != address(0)) {
				totalStakes[prevDelegatee] = totalStakes[prevDelegatee].sub(stake);
				_placeInCommittee(prevDelegatee); // TODO may emit superfluous event
		}
		totalStakes[to] = totalStakes[to].add(stake);
		_placeInCommittee(to);

		delegations[msg.sender] = to;

		emit Delegated(msg.sender, to);
	}

	function staked(address staker, uint256 amount) external onlyStakingContract {
		address delegatee = delegations[staker];
		if (delegatee == address(0)) {
			delegatee = staker;
		}
		totalStakes[delegatee] = totalStakes[delegatee].add(amount);
		ownStakes[staker] = ownStakes[staker].add(amount);
		_placeInCommittee(delegatee);
	}

	function unstaked(address staker, uint256 amount) external onlyStakingContract {
		address delegatee = delegations[staker];
		if (delegatee == address(0)) {
			delegatee = staker;
		}
		totalStakes[delegatee] = totalStakes[delegatee].sub(amount);
		ownStakes[staker] = ownStakes[staker].sub(amount);
		_placeInCommittee(delegatee);
	}

	function _placeInCommittee(address validator) private {
		(uint p, bool inCommittee) = _qualifyAndAppend(validator);
		if (!inCommittee) {
			return;
		}

		uint256[] memory stakes = _sortCommitteeMember(p);

		require(stakes.length == committee.length, "error sorting committee by stake");
		emit CommitteeChanged(committee, stakes);
	}

	function _sortCommitteeMember(uint memberPos) private returns (uint256[]){
		uint256[] memory stakes = new uint256[](committee.length);
		for (uint i=0; i<committee.length; i++) {
			stakes[i] = totalStakes[committee[i]];
		}

		while (memberPos > 0 && stakes[memberPos] > stakes[memberPos-1]) {
			_replace(stakes, memberPos-1, memberPos);
			memberPos--;
		}

		while (memberPos < stakes.length - 1 && stakes[memberPos] < stakes[memberPos+1]) {
			_replace(stakes, memberPos, memberPos+1);
			memberPos++;
		}
		return stakes;
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

		if (committee.length == maxCommitteeSize) { // a full committee
			bool qualifyToEnter = totalStakes[stakeOwner] > totalStakes[committee[committee.length-1]];
			if (!qualifyToEnter) {
				return (0, false);
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

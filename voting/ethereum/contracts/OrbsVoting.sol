pragma solidity 0.5.3;


import "./IOrbsVoting.sol";


contract OrbsVoting is IOrbsVoting {
    struct VotingRecord {
        uint blockNumber;
        address[] validators;
    }

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    uint internal voteCounter;
    uint internal delegationCounter;
    uint public maxVoteOutLength;

    mapping(address => VotingRecord) internal lastVotes;
    mapping(address => address) internal lastDelegations;


    constructor(uint maxVoteOutLength_) public {
        voteCounter = 0;
        delegationCounter = 0;
        maxVoteOutLength = maxVoteOutLength_;
    }

    function voteOut(address[] memory validators) public {
        require(validators.length <= maxVoteOutLength, "Validators list is over the allowed length");

        uint validatorsLength = validators.length;
        bytes20[] memory addressesAsBytes20 = new bytes20[](validatorsLength);
        for (uint i=0; i < validatorsLength; i++) {
            require(validators[i] != address(0), "All validator addresses must be non 0");
            addressesAsBytes20[i] = bytes20(validators[i]);
        }

        voteCounter++;

        lastVotes[msg.sender] = VotingRecord(block.number, validators);

        emit VoteOut(msg.sender, addressesAsBytes20, voteCounter);
    }

    function delegate(address to) public {
        require(to != address(0), "must delegate to non 0");

        delegationCounter++;

        lastDelegations[msg.sender] = to;

        emit Delegate(msg.sender, to, delegationCounter);
    }

    function getCurrentVote(address guardian)
        public
        view
        returns (address[] memory validators, uint blockNumber)
    {
        VotingRecord storage lastVote = lastVotes[guardian];

        require(lastVote.blockNumber > 0, "Guardian never voted");

        blockNumber = lastVote.blockNumber;
        validators = lastVote.validators;
    }

    function getCurrentDelegation(address delegator)
    public
    view
    returns (address to)
    {
        return lastDelegations[delegator];
    }
}
pragma solidity 0.5.3;


import "./IOrbsVoting.sol";


contract OrbsVoting is IOrbsVoting {
    struct VotingRecord {
        uint blockHeight;
        address[] validators;
    }

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    uint voteCounter;
    uint delegationCounter;
    uint public maxVoteOutNodes;

    mapping(address => VotingRecord) lastVotes;
    mapping(address => address) lastDelegations;


    constructor(uint maxVoteOutNodes_) public {
        voteCounter = 0;
        delegationCounter = 0;
        maxVoteOutNodes = maxVoteOutNodes_;
    }

    function voteOut(address[] memory validators) public {
        require(validators.length <= maxVoteOutNodes, "Validators list is over the allowed length");

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

    function getLastVote(address guardian)
        public
        view
        returns (address[] memory validators, uint blockHeight)
    {
        VotingRecord storage lastVote = lastVotes[guardian];

        require(lastVote.blockHeight > 0, "Guardian never voted");

        blockHeight = lastVote.blockHeight;
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
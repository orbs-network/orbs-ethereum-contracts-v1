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
        uint validatorsLength = validators.length;
        require(validatorsLength <= maxVoteOutLength, "Validators list is over the allowed length");

        for (uint i=0; i < validatorsLength; i++) {
            require(validators[i] != address(0), "All validator addresses must be non 0");
        }

        voteCounter++;

        lastVotes[msg.sender] = VotingRecord(block.number, validators);

        emit VoteOut(msg.sender, validators, voteCounter);
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

    function getCurrentVoteBytes20(address guardian)
        public
        view
        returns (bytes20[] memory validatorsBytes20, uint blockNumber)
    {
        address[] memory validatorAddresses;
        (validatorAddresses, blockNumber) = getCurrentVote(guardian);

        uint validatorAddressesLength = validatorAddresses.length;

        validatorsBytes20 = new bytes20[](validatorAddressesLength);

        for (uint i = 0; i < validatorAddressesLength; i++) {
            validatorsBytes20[i] = bytes20(validatorAddresses[i]);
        }
    }

    function getCurrentDelegation(address delegator)
    public
    view
    returns (address)
    {
        return lastDelegations[delegator];
    }
}
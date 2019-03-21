pragma solidity 0.5.3;


import "./IOrbsVoting.sol";


contract OrbsVoting is IOrbsVoting {
    struct VotingRecord {
        uint blockNumber;
        address[] validators;
    }

    // The version of the current Voting smart contract.
    uint public constant VERSION = 1;

    uint internal voteCounter;
    uint internal delegationCounter;
    uint public maxVoteOutCount;

    mapping(address => VotingRecord) internal votes;
    mapping(address => address) internal delegations;


    constructor(uint maxVoteOutCount_) public {
        voteCounter = 0;
        delegationCounter = 0;
        maxVoteOutCount = maxVoteOutCount_;
    }

    function voteOut(address[] memory validators) public {
        uint validatorsLength = validators.length;
        require(validatorsLength <= maxVoteOutCount, "Validators list is over the allowed length");

        for (uint i=0; i < validatorsLength; i++) {
            require(validators[i] != address(0), "All validator addresses must be non 0");
        }

        voteCounter++;

        votes[msg.sender] = VotingRecord(block.number, validators);

        emit VoteOut(msg.sender, validators, voteCounter);
    }

    //If you want to cancel delegation - delegate to yourself
    function delegate(address to) public {
        require(to != address(0), "must delegate to non 0");

        delegationCounter++;

        delegations[msg.sender] = to;

        if (msg.sender == to) {
            delete delegations[msg.sender];
        }

        emit Delegate(msg.sender, to, delegationCounter);
    }

    function getCurrentVote(address guardian)
        public
        view
        returns (address[] memory validators, uint blockNumber)
    {
        VotingRecord memory lastVote = votes[guardian];

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
        return delegations[delegator];
    }
}
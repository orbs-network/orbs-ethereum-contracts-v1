pragma solidity 0.4.25;


import "./IOrbsVoting.sol";


contract OrbsVoting is IOrbsVoting {

    // A vote is a pair of block number and list of validators since a vote is only valid for X blocks (X is initially 40,320 blocks, but this can change in the future)
    struct VotingRecord {
        uint blockNumber;
        address[] validators;
    }

    // The version of the current Voting smart contract.
    uint public constant VERSION = 1;

    // vars to see that voting and delegating is moving forward.
    uint internal voteCounter;
    uint internal delegationCounter;

    // The amount of validators you can vote out in each election round. This will be set to 3 in the construction.
    uint public maxVoteOutCount;

    // Internal mappings to keep track of the votes and delegations.
    mapping(address => VotingRecord) internal votes;
    mapping(address => address) internal delegations;

    /// @dev Constructor that initializes the Voting contract. maxVoteOutCount will be set to 3.
    constructor(uint maxVoteOutCount_) public {
        voteCounter = 0;
        delegationCounter = 0;
        maxVoteOutCount = maxVoteOutCount_;
    }

    /// @dev Voting method to select which validators you want to vote out in this election period.
    /// @param validators address[] an array of validators addresses you want to vote out. In case you want to vote, but not vote out anyone, send an empty array.
    function voteOut(address[] validators) external {
        uint validatorsLength = validators.length;
        require(validatorsLength <= maxVoteOutCount, "Validators list is over the allowed length");

        for (uint i=0; i < validatorsLength; i++) {
            require(validators[i] != address(0), "All validator addresses must be non 0");
        }

        voteCounter++;

        votes[msg.sender] = VotingRecord(block.number, validators);

        emit VoteOut(msg.sender, validators, voteCounter);
    }

    /// @dev Delegation method to select who you would like to delegate your stake to.
    /// @param to address the address, you want to delegate your stake to. If you want to cancel a delegation - delegate to yourself to yourself.
    function delegate(address to) external {
        require(to != address(0), "must delegate to non 0");

        delegationCounter++;

        delegations[msg.sender] = to;

        if (msg.sender == to) {
            delete delegations[msg.sender];
        }

        emit Delegate(msg.sender, to, delegationCounter);
    }

    /// @dev returns vote pair - validators list and the block number the vote was set.
    ///      like getCurrentVote but returns byte20 which is more compatible in some cases.
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

    /// @dev returns the address to which the delegator has delegated the stake
    /// @param delegator address the address of the delegator
    function getCurrentDelegation(address delegator)
        public
        view
        returns (address)
    {
        return delegations[delegator];
    }

    /// @dev returns vote pair - validators list and the block number the vote was set.
    /// @param guardian address the address of the guardian
    function getCurrentVote(address guardian)
        public
        view
        returns (address[] memory validators, uint blockNumber)
    {
        VotingRecord storage lastVote = votes[guardian];

        blockNumber = lastVote.blockNumber;
        validators = lastVote.validators;
    }
}
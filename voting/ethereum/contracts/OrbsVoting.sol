pragma solidity 0.4.25;


import "./IOrbsVoting.sol";


contract OrbsVoting is IOrbsVoting {

    // A vote is a pair of block number and list of validators. The vote's block
    // number is used to determine the vote qualification for an election event.
    struct VotingRecord {
        uint blockNumber;
        address[] validators;
    }

    // The version of the current Voting smart contract.
    uint public constant VERSION = 1;

    // Vars to see that voting and delegating is moving forward. Is used to emit
    // events to test for completeness.
    uint internal voteCounter;
    uint internal delegationCounter;

    // The amount of validators you can vote out in each election round. This will be set to 3 in the construction.
    uint public maxVoteOutCount;

    // Internal mappings to keep track of the votes and delegations.
    mapping(address => VotingRecord) internal votes;
    mapping(address => address) internal delegations;

    /// @dev Constructor that initializes the Voting contract. maxVoteOutCount will be set to 3.
    constructor(uint maxVoteOutCount_) public {
        require(maxVoteOutCount_ > 0, "maxVoteOutCount_ must be positive");
        maxVoteOutCount = maxVoteOutCount_;
    }

    /// @dev Voting method to select which validators you want to vote out in this election period.
    /// @param validators address[] an array of validators addresses you want to vote out. In case you want to vote, but not vote out anyone, send an empty array.
    function voteOut(address[] validators) external {
        address sender = msg.sender;
        require(validators.length <= maxVoteOutCount, "Validators list is over the allowed length");
        sanitizeValidators(validators);

        voteCounter++;

        votes[sender] = VotingRecord({
            blockNumber: block.number,
            validators: validators
        });

        emit VoteOut(sender, validators, voteCounter);
    }

    /// @dev Delegation method to select who you would like to delegate your stake to.
    /// @param to address the address, you want to delegate your stake to. If you want to cancel a delegation - delegate to yourself to yourself.
    function delegate(address to) external {
        address sender = msg.sender;
        require(to != address(0), "must delegate to non 0");
        require(sender != to , "cant delegate to yourself");

        delegationCounter++;

        delegations[sender] = to;

        emit Delegate(sender, to, delegationCounter);
    }

    /// @dev Delegation method to select who you would like to delegate your stake to.
    function undelegate() external {
        address sender = msg.sender;
        delegationCounter++;

        delete delegations[sender];

        emit Delegate(sender, sender, delegationCounter);
        emit Undelegate(sender, delegationCounter);
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

    /// @dev check that the validators array is unique and non zero.
    /// @param validators address[]
    function sanitizeValidators(address[] validators)
        private
        pure
    {
        uint validatorsLength = validators.length;
        for (uint i = 0; i < validatorsLength; i++) {
            require(validators[i] != address(0), "All validator addresses must be non 0");
            for (uint j = i + 1; j < validatorsLength; j++) {
                require(validators[j] != validators[i], "Duplicate Validators");
            }
        }
    }
}
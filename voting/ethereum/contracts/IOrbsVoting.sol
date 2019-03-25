pragma solidity 0.4.25;


interface IOrbsVoting {

    event VoteOut(address indexed voter, address[] validators, uint voteCounter);
    event Delegate(
        address indexed delegator,
        address indexed to,
        uint delegationCounter
    );
    event Undelegate(address indexed delegator, uint delegationCounter);

    /// @dev Voting method to select which validators you want to vote out in this election period.
    /// @param validators address[] an array of validators addresses you want to vote out. In case you want to vote, but not vote out anyone, send an empty array.
    function voteOut(address[] validators) external;

    /// @dev Delegation method to select who you would like to delegate your stake to.
    /// @param to address the address, you want to delegate your stake to. If you want to cancel a delegation - delegate to yourself to yourself.
    function delegate(address to) external;

    /// @dev Delegation method to select who you would like to delegate your stake to.
    function undelegate() external;

    /// @dev returns vote pair - validators list and the block number the vote was set.
    /// @param guardian address the address of the guardian
    function getCurrentVote(address guardian)
        external
        view
        returns (address[] validators, uint blockNumber);

    /// @dev returns vote pair - validators list and the block number the vote was set.
    ///      same as getCurrentVote but returns addresses represented as byte20.
    function getCurrentVoteBytes20(address guardian)
        external
        view
        returns (bytes20[] validatorsBytes20, uint blockNumber);

    /// @dev returns the address to which the delegator has delegated the stake
    /// @param delegator address the address of the delegator
    function getCurrentDelegation(address delegator)
        external
        view
        returns (address);
}
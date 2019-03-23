pragma solidity 0.4.25;


interface IOrbsVoting {
    event VoteOut(address indexed voter, address[] validators, uint voteCounter);
    event Delegate(
        address indexed delegator,
        address indexed to,
        uint delegationCounter
    );

    function voteOut(address[] validators) external;
    function delegate(address to) external;
    function getCurrentVote(address guardian)
        external
        view
        returns (address[] validators, uint blockNumber);
    function getCurrentVoteBytes20(address guardian)
        external
        view
        returns (bytes20[] validatorsBytes20, uint blockNumber);
    function getCurrentDelegation(address delegator)
        external
        view
        returns (address);
}
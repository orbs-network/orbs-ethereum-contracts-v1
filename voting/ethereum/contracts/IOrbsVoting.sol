pragma solidity 0.5.3;


interface IOrbsVoting {
    event VoteOut(address indexed voter, bytes20[] validators, uint voteCounter);
    event Delegate(
        address indexed delegator,
        address indexed to,
        uint delegationCounter
    );

    function voteOut(address[] calldata validators) external;
    function delegate(address to) external;
    function getLastVote(address guardian)
        external
        view
        returns (address[] memory validators, uint blockHeight);
    function getCurrentDelegation(address delegator)
        external
        view
        returns (address to);
}
pragma solidity 0.5.3;


interface IOrbsVoting {
    event Vote(address indexed voter, bytes20[] nodes_list, uint vote_counter);
    event Delegate(
        address indexed delegator,
        address indexed to,
        uint delegation_counter
    );

    function vote(address[] calldata nodes_list) external;
    function delegate(address to) external;
    function getLastVote(address _guardian)
    external
    view
    returns (address[] memory nodes, uint block_height);
}
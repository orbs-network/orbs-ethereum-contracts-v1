pragma solidity 0.5.3;


import "./IOrbsVoting.sol";


contract OrbsVoting is IOrbsVoting {
    struct VotingRecord {
        uint blockHeight;
        address[] nodes;
    }

    uint voteCounter = 0;
    uint delegationCounter = 0;

    mapping(address => VotingRecord[]) votingRecords;

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    function vote(address[] memory nodes) public {
        require(nodes.length > 0, "Must provide non empty list");

        uint nodesLength = nodes.length;
        bytes20[] memory addressesAsBytes20 = new bytes20[](nodesLength);
        for (uint i=0; i < nodesLength; i++) {
            require(nodes[i] != address(0), "All nodes must be non 0");
            addressesAsBytes20[i] = bytes20(nodes[i]);
        }

        voteCounter++;

        votingRecords[msg.sender].push(VotingRecord(block.number, nodes));

        emit Vote(msg.sender, addressesAsBytes20, voteCounter);
    }

    function delegate(address to) public {
        delegationCounter++;
        emit Delegate(msg.sender, to, delegationCounter);
    }

    function getLastVote(address guardian)
        public
        view
        returns (address[] memory nodes, uint blockHeight)
    {
        VotingRecord[] storage votings = votingRecords[guardian];

        require(votings.length > 0, "Guardian never voted");

        VotingRecord storage lastVote = votings[votings.length - 1];

        blockHeight = lastVote.blockHeight;
        nodes = lastVote.nodes;
    }
}
pragma solidity 0.5.3;


import "./IOrbsVoting.sol";


contract OrbsVoting is IOrbsVoting {
    struct VotingRecord {
        uint blockHeight;
        address[] nodes;
    }

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    uint voteCounter;
    uint delegationCounter;
    uint public maxVoteOutNodes;

    mapping(address => VotingRecord[]) votingRecords;


    constructor(uint maxVoteOutNodes_) public {
        voteCounter = 0;
        delegationCounter = 0;
    maxVoteOutNodes = maxVoteOutNodes_;
    }

    function voteOut(address[] memory nodes) public {
        require(nodes.length <= maxVoteOutNodes, "Nodes list is over the allowed length");

        uint nodesLength = nodes.length;
        bytes20[] memory addressesAsBytes20 = new bytes20[](nodesLength);
        for (uint i=0; i < nodesLength; i++) {
            require(nodes[i] != address(0), "All nodes must be non 0");
            addressesAsBytes20[i] = bytes20(nodes[i]);
        }

        voteCounter++;

        votingRecords[msg.sender].push(VotingRecord(block.number, nodes));

        emit VoteOut(msg.sender, addressesAsBytes20, voteCounter);
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
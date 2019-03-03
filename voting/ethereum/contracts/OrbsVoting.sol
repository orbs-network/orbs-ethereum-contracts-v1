pragma solidity 0.5.3;

interface IOrbsVoting {
    event Vote(address indexed voter, bytes20[] nodes_list, uint vote_counter);
    event Delegate(address indexed stakeholder, address indexed to, uint delegation_counter);

    function vote(address[] calldata nodes_list) external;
    function delegate(address to) external;
}

contract OrbsVoting is IOrbsVoting {
    struct VotingRecord {
        uint block_height;
        address[] nodes;
    }

    uint vote_counter = 0; // will reset back to zero when uint is exhausted
    uint delegation_counter = 0; // will reset back to zero when uint is exhausted

    mapping (address => VotingRecord[]) votingRecords;

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    function vote(address[] memory nodes) public {
        require(nodes.length > 0, "Must provide non empty list");

        bytes20[] memory addressesAsBytes20 = new bytes20[](nodes.length);
        for (uint i=0; i < nodes.length; i++) {
            require(nodes[i] != address(0), "All nodes must be non 0");
            addressesAsBytes20[i] = bytes20(nodes[i]);
        }

        vote_counter++;

        votingRecords[msg.sender].push(VotingRecord(block.number, nodes));

        emit Vote(msg.sender, addressesAsBytes20, vote_counter);
    }

    function delegate(address to) public {
        delegation_counter++;
        emit Delegate(msg.sender, to, delegation_counter);
    }

    function getLastVote(address _guardian) public view returns (address[] memory nodes, uint block_height) {
        VotingRecord[] storage votings = votingRecords[_guardian];

        require(votings.length > 0, "Guardian never voted");

        VotingRecord storage lastVote = votings[votings.length - 1];

        block_height = lastVote.block_height;
        nodes = lastVote.nodes;
    }

}
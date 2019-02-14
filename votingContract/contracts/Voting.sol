pragma solidity 0.5.3;

interface IVoting {
    function vote(address[] calldata candidates) external;
    function delegate(address activist) external;
}

contract Voting is IVoting {
    event Vote(address indexed activist, address indexed candidate, uint vote_counter);
    event Delegated(address indexed stakeholder, address indexed activist, uint delegation_counter);

    uint public vote_counter = 0; // will reset back to zero when uint is exhausted
    uint public delegation_counter = 0; // will reset back to zero when uint is exhausted

    function vote(address[] memory candidates) public {
        vote_counter++;
        uint arrayLength = candidates.length;
        for (uint i=0; i<arrayLength; i++) {
            emit Vote(msg.sender, candidates[i], vote_counter);
        }
    }

    function delegate(address activist) public {
        delegation_counter++;
        emit Delegated(msg.sender, activist, delegation_counter);
    }
}
pragma solidity 0.5.3;

import "./ISubscriptionChecker.sol";

contract FakeSubscriptionChecker is ISubscriptionChecker {
    function getSubscriptionData(bytes32 _id) public view returns (bytes32 id, string memory profile, uint256 startTime, uint256 tokens) {
        uint256 intId = uint256(_id);
        if (intId == 42) {
            return (_id, "B2", 0, toSatoshiOrbs(1000)); // underfunded
        }
    }

    function toSatoshiOrbs(int value) pure private returns (uint256 valueInSatoshiOrbs) {
        return uint256(value) * uint256(1000000000000000000);
    }
}

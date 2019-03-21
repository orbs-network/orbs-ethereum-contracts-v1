pragma solidity 0.5.3;

interface ISubscriptionChecker {
    /// @param _id the virtual chain id to check subscription for
    /// @return profile - the subscribed plan, e.g. 'gold', 'silver', etc
    function getSubscriptionData(bytes32 _id) external view returns (bytes32 id, string memory profile, uint256 startTime, uint256 tokens);
}

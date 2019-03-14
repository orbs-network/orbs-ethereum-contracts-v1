pragma solidity ^0.4.0;

interface ISubscriptionChecker {
    /// @param _id the virtual chain id to check subscription for
    /// @return profile - the subscribed plan, e.g. 'gold', 'silver', etc
    function getSubscriptionData(bytes32 _id) external view returns (bytes32 id, string profile, uint256 startTime, uint256 tokens);
}

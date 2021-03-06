pragma solidity 0.4.26;


interface IOrbsRewardsDistribution {
    event RewardDistributed(string distributionEvent, address indexed recipient, uint256 amount);

    event RewardsDistributionAnnounced(string distributionEvent, bytes32[] batchHash, uint256 batchCount);
    event RewardsBatchExecuted(string distributionEvent, bytes32 batchHash, uint256 batchIndex);
    event RewardsDistributionAborted(string distributionEvent, bytes32[] abortedBatchHashes, uint256[] abortedBatchIndices);
    event RewardsDistributionCompleted(string distributionEvent);

    event RewardsDistributorReassigned(address indexed previousRewardsDistributor, address indexed newRewardsDistributor);

    function announceDistributionEvent(string distributionEvent, bytes32[] batchHashes) external;
    function abortDistributionEvent(string distributionEvent) external;

    function executeCommittedBatch(string distributionEvent, address[] recipients, uint256[] amounts, uint256 batchIndex) external;

    function distributeRewards(string distributionEvent, address[] recipients, uint256[] amounts) external;

    function getPendingBatches(string distributionEvent) external view returns (bytes32[] pendingBatchHashes, uint256[] pendingBatchIndices);
    function reassignRewardsDistributor(address _newRewardsDistributor) external;
    function isRewardsDistributor() external returns (bool);
}
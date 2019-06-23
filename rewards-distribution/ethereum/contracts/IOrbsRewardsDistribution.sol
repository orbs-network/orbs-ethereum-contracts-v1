pragma solidity 0.4.25;


interface IOrbsRewardsDistribution {
    event RewardsDistributed(string distributionName, address indexed recipient, uint256 amount);

    event RewardsDistributionAnnounced(string distributionName, bytes32[] batchHash, uint256 batchCount);
    event RewardsBatchExecuted(string distributionName, bytes32 batchHash, uint256 batchNum);
    event RewardsDistributionAborted(string distributionName, bytes32[] abortedBatchHashes, uint256[] abortedBatchNums);
    event RewardsDistributionCompleted(string distributionName);

    function announceDistributionEvent(string distributionName, bytes32[] batchHashes) external;
    function abortDistributionEvent(string distributionName) external;

    function executeCommittedBatch(string distributionName, address[] recipients, uint256[] amounts, uint256 batchNum) external;

    /**
    * called by owner to bypass distribution announcements and batch hash commitments
    */
    function distributeFees(string distributionName, address[] recipients, uint256[] amounts) external;

    function getPendingBatches(string distributionName) external view returns (bytes32[] batchHashes, uint256[] batchNums);
}
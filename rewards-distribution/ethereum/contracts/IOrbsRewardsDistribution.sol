pragma solidity 0.4.25;


interface IOrbsRewardsDistribution {
    event RewardsDistributed(string distributionName, address recipient, uint256 amount);

    function commitDistributionEvent(string distributionName, bytes32[] batchHashes);
    function abortDistributionEvent(string distributionName);
    function distributeFees(string distributionName, address[] recipients, uint256[] amounts);
    function executeCommittedBatch(string distributionName, address[] recipients, uint256[] amounts, uint32 batchNum);

    function getOngoingDistributionEvents() returns (string[] distributionName, uint32 pendingBatches);
}
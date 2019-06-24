pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./IOrbsRewardsDistribution.sol";

contract OrbsRewardsDistribution is Ownable, IOrbsRewardsDistribution {

    // The Orbs token smart contract.
    IERC20 public orbs;

    struct Distribution {
        bool ongoing;
        uint256 pendingBatchCount;
        bytes32[] batchHashes;
    }

    mapping(string => Distribution) distributions;

    constructor(IERC20 _orbs) public {
        require(address(_orbs) != address(0), "Address must not be 0!");
        orbs = _orbs;
    }

    function announceDistributionEvent(string distributionEvent, bytes32[] _batchHashes) external onlyOwner {
        require(distributions[distributionEvent].ongoing == false, "named distribution is currently ongoing");
        require(_batchHashes.length >= 1, "at least one distribution must be announced");
        for (uint256 i = 0; i < _batchHashes.length; i++) {
            require(_batchHashes[i] != bytes32(0), "batch hash may not be 0x0");
        }

        Distribution storage distribution = distributions[distributionEvent];
        distribution.ongoing = true;
        distribution.pendingBatchCount = _batchHashes.length;
        distribution.batchHashes = _batchHashes;

        emit RewardsDistributionAnnounced(distributionEvent, _batchHashes, _batchHashes.length);
    }

    function abortDistributionEvent(string distributionEvent) external onlyOwner {
        (bytes32[] memory abortedBatchHashes, uint256[] memory abortedBatchIndices) = this.getPendingBatches(distributionEvent);

        delete distributions[distributionEvent];

        emit RewardsDistributionAborted(distributionEvent, abortedBatchHashes, abortedBatchIndices);
    }

    function _distributeRewards(string distributionEvent, address[] recipients, uint256[] amounts) private {
        uint256 batchSize = recipients.length;
        require(batchSize == amounts.length, "array length mismatch");

        for (uint256 i = 0; i < batchSize; i++) {
            require(recipients[i] != address(0), "recipient must be a valid address");
            orbs.transfer(recipients[i], amounts[i]);
            emit RewardDistributed(distributionEvent, recipients[i], amounts[i]);
        }
    }

    function distributeRewards(string distributionEvent, address[] recipients, uint256[] amounts) external onlyOwner {
        _distributeRewards(distributionEvent, recipients, amounts);
    }

    function executeCommittedBatch(string distributionEvent, address[] recipients, uint256[] amounts, uint256 batchIndex) external {
        Distribution storage distribution = distributions[distributionEvent];

        require(recipients.length == amounts.length, "array length mismatch");
        require(recipients.length >= 1, "at least one reward must be included in a batch");
        require(distribution.ongoing == true, "distribution is not currently ongoing");
        require(distribution.batchHashes.length > batchIndex, "batch number out of range");
        require(distribution.batchHashes[batchIndex] != bytes32(0), "specified batch number already executed");

        bytes32 calculatedHash = calcBatchHash(recipients, amounts, batchIndex);
        require(distribution.batchHashes[batchIndex] == calculatedHash, "batch hash does not match");

        distribution.pendingBatchCount--;
        distribution.batchHashes[batchIndex] = bytes32(0); // delete

        _distributeRewards(distributionEvent, recipients, amounts);

        emit RewardsBatchExecuted(distributionEvent, calculatedHash, batchIndex);

        if (distribution.pendingBatchCount == 0) {
            delete distributions[distributionEvent];
            emit RewardsDistributionCompleted(distributionEvent);
        }
    }

    function getPendingBatches(string distributionEvent) external view returns (bytes32[] pendingBatchHashes, uint256[] pendingBatchIndices) {
        Distribution storage distribution = distributions[distributionEvent];
        bytes32[] storage batchHashes = distribution.batchHashes;
        uint256 pendingBatchCount = distribution.pendingBatchCount;
        uint256 batchHashesLength = distribution.batchHashes.length;

        pendingBatchHashes = new bytes32[](pendingBatchCount);
        pendingBatchIndices = new uint256[](pendingBatchCount);

        uint256 addNextAt = 0;
        for (uint256 i = 0; i < batchHashesLength; i++) {
            bytes32 hash = batchHashes[i];
            if (hash != bytes32(0)) {
                pendingBatchIndices[addNextAt] = i;
                pendingBatchHashes[addNextAt] = hash;
                addNextAt++;
            }
        }
    }

    function drainOrbs(address to) external onlyOwner {
        // TODO - transfer to owner/sender, merge with abort?
        require(to != address(0), "to address missing");
        uint256 balance = orbs.balanceOf(address(this));
        orbs.transfer(to, balance);
    }

    function calcBatchHash(address[] recipients, uint256[] amounts, uint256 batchIndex) private pure returns (bytes32) {
        // TODO - do we really need recipients.length in the hash?...
        return keccak256(abi.encodePacked(batchIndex, recipients.length, recipients, amounts));
    }
}
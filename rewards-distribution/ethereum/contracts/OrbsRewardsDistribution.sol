pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./IOrbsRewardsDistribution.sol";

contract OrbsRewardsDistribution is Ownable, IOrbsRewardsDistribution {

    // The Orbs token smart contract.
    IERC20 public orbs;

    struct Distribution {
        uint256 totalBatches;
        uint256 pendingBatches;
        mapping(uint256 => bytes32) batchHashes;
    }

    mapping(string => Distribution) distributions;

    constructor(IERC20 _orbs) public {
        require(address(_orbs) != address(0), "Address must not be 0!");
        orbs = _orbs;
    }

    function announceDistributionEvent(string distributionName, bytes32[] _batchHashes) external onlyOwner {
        require(distributions[distributionName].totalBatches == 0, "named distribution is currently ongoing");
        require(_batchHashes.length >= 1, "at least one distribution must be announced");

        uint256 batchLength = _batchHashes.length;
        Distribution storage distribution = distributions[distributionName];
        distribution.totalBatches = batchLength;
        distribution.pendingBatches = batchLength;

        mapping(uint256 => bytes32) batchHashes = distribution.batchHashes;

        for (uint256 i = 0; i < batchLength; i++) {
            batchHashes[i] = _batchHashes[i];
        }
        emit RewardsDistributionAnnounced(distributionName, _batchHashes, _batchHashes.length);
    }

    function abortDistributionEvent(string distributionName) external onlyOwner {
        Distribution storage distribution = distributions[distributionName];
        uint256 totalBatches = distribution.totalBatches;
        mapping(uint256=>bytes32) batchHashes = distribution.batchHashes;

        (bytes32[] memory abortedBatchHahes, uint256[] memory abortedBatchNums) = this.getPendingBatches(distributionName);

        for (uint256 i = 0; i < totalBatches; i++) {
            if (batchHashes[i] != 0) {
                delete batchHashes[i];
            }
        }
        delete distributions[distributionName];
        emit RewardsDistributionAborted(distributionName, abortedBatchHahes, abortedBatchNums);
    }

    function _distributeFees(string distributionName, address[] recipients, uint256[] amounts) private {
        uint256 batchSize = recipients.length;
        for (uint256 i = 0; i < batchSize; i++) {
            orbs.transfer(recipients[i], amounts[i]);
            emit RewardsDistributed(distributionName, recipients[i], amounts[i]);
        }
    }

    function distributeFees(string distributionName, address[] recipients, uint256[] amounts) external onlyOwner {
        _distributeFees(distributionName, recipients, amounts);
    }

    function executeCommittedBatch(string distributionName, address[] recipients, uint256[] amounts, uint256 batchNum) external {
        Distribution storage distribution = distributions[distributionName];

        require(recipients.length == amounts.length, "array length mismatch");
        require(recipients.length >= 1, "at least one reward must be included in a batch");
        require(distribution.totalBatches > 0, "distribution is not currently ongoing");
        require(distribution.totalBatches >= batchNum, "batch number out of range");

        bytes32 calculatedHash = calcBatchHash(recipients, amounts, batchNum);
        require(distribution.batchHashes[batchNum] == calculatedHash, "batch hash does not match");
        delete distribution.batchHashes[batchNum];

        distribution.pendingBatches--;
        if (distribution.pendingBatches == 0) {
            delete distributions[distributionName];
        }

        _distributeFees(distributionName, recipients, amounts);
    }

    function getPendingBatches(string distributionName) external view returns (bytes32[] batchHashes, uint256[] batchNums) {
        Distribution storage distribution = distributions[distributionName];

        batchHashes = new bytes32[](distribution.pendingBatches);
        batchNums = new uint256[](distribution.pendingBatches);

        mapping(uint256 => bytes32) batchHashesMap = distribution.batchHashes;

        uint256 nextAddAtPos = 0;
        for (uint256 i = 0; i < batchHashes.length; i++) {
            bytes32 hash = batchHashesMap[i];
            if (hash != 0) {
                batchNums[nextAddAtPos] = i;
                batchHashes[nextAddAtPos] = hash;
                nextAddAtPos++;
            }
        }
    }

    function drainOrbs(address to) external onlyOwner {
        require(to != address(0), "to address missing");
        uint256 balance = orbs.balanceOf(address(this));
        orbs.transfer(to, balance);
    }

    function calcBatchHash(address[] recipients, uint256[] amounts, uint256 batchNum) private pure returns (bytes32) {
        // TODO - do we really need recipients.length in the hash?...
        return keccak256(abi.encodePacked(batchNum, recipients.length, recipients, amounts));
    }
}
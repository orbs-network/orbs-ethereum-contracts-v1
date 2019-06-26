pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./IOrbsRewardsDistribution.sol";

/// @title Orbs rewards distribution smart contract.
contract OrbsRewardsDistribution is Ownable, IOrbsRewardsDistribution {

    /// The Orbs token smart contract.
    IERC20 public orbs;

    struct Distribution {
        bool ongoing;
        uint256 pendingBatchCount;
        bytes32[] batchHashes;
    }

    /// Mapping of all ongoing distribution events.
    /// Distribution events are identified by a unique string
    /// for the duration of their execution.
    /// After completion or abortion the same name may be used again.
    mapping(string => Distribution) distributions;

    /// @dev Constructor to set Orbs token contract address.
    /// @param _orbs IERC20 The address of the Orbs token contract.
    constructor(IERC20 _orbs) public {
        require(address(_orbs) != address(0), "Address must not be 0!");
        orbs = _orbs;
    }

    /// @dev Declares a new distribution event. Verifies a distribution
    /// event with the same name is not already ongoing, and records commitments
    /// for all reward payments in the form of batch hashes array to state.
    /// @param distributionEvent string Name of a new distribution event
    /// @param batchHashes bytes32[] The address of the OrbsValidators contract.
    function announceDistributionEvent(string distributionEvent, bytes32[] batchHashes) external onlyOwner {
        require(distributions[distributionEvent].ongoing == false, "named distribution is currently ongoing");
        require(batchHashes.length >= 1, "at least one batch must be announced");

        for (uint256 i = 0; i < batchHashes.length; i++) {
            require(batchHashes[i] != bytes32(0), "batch hash may not be 0x0");
        }

        // store distribution event record
        Distribution storage distribution = distributions[distributionEvent];
        distribution.ongoing = true;
        distribution.pendingBatchCount = batchHashes.length;
        distribution.batchHashes = batchHashes;

        emit RewardsDistributionAnnounced(distributionEvent, batchHashes, batchHashes.length);
    }

    /// @dev Aborts an ongoing distributionEvent and revokes all batch commitments.
    /// @param distributionEvent string Name of a new distribution event
    function abortDistributionEvent(string distributionEvent) external onlyOwner {
        require(distributions[distributionEvent].ongoing == true, "named distribution is not currently ongoing");

        (bytes32[] memory abortedBatchHashes, uint256[] memory abortedBatchIndices) = this.getPendingBatches(distributionEvent);

        delete distributions[distributionEvent];

        emit RewardsDistributionAborted(distributionEvent, abortedBatchHashes, abortedBatchIndices);
    }

    /// @dev Carry out and logs transfers in batch. receives two arrays of same length
    /// representing rewards payments for a list of reward recipients.
    /// distributionEvent is only provided for logging purposes.
    /// @param distributionEvent string Name of a new distribution event
    /// @param recipients address[] a list of recipients addresses
    /// @param amounts uint256[] a list of amounts to transfer each recipient at the corresponding array index
    function _distributeRewards(string distributionEvent, address[] recipients, uint256[] amounts) private {
        uint256 batchSize = recipients.length;
        require(batchSize == amounts.length, "array length mismatch");

        for (uint256 i = 0; i < batchSize; i++) {
            require(recipients[i] != address(0), "recipient must be a valid address");
            orbs.transfer(recipients[i], amounts[i]);
            emit RewardDistributed(distributionEvent, recipients[i], amounts[i]);
        }
    }

    /// @dev Bypasses announcement/commitment process flow for batch payments.
    /// Requires owner privileges to execute. Provided as a mechanism for
    /// alternative batch commitment mechanisms if needed in the future.
    /// @param distributionEvent string Name of a new distribution event
    /// @param recipients address[] a list of recipients addresses
    /// @param amounts uint256[] a list of amounts to transfer each recipient at the corresponding array index
    function distributeRewards(string distributionEvent, address[] recipients, uint256[] amounts) external onlyOwner {
        // TODO - TBD - replace onlyOwner with a special role - "onlyRewardsDistributer". will simplify future contracts and reduce chances of human error by keeping the owner constant.
        _distributeRewards(distributionEvent, recipients, amounts);
    }

    /// @dev Accepts a batch of payments associated with a distributionEvent.
    /// Once validated against the batch hash commitment, the batch is cleared from commitment array
    /// and executed.
    /// If this was the last batch in distributionEvent, the record is
    /// cleared and distributionEvent is logged as completed.
    /// @param distributionEvent string Name of a new distribution event
    /// @param recipients address[] a list of recipients addresses
    /// @param amounts uint256[] a list of amounts to transfer each recipient at the corresponding array index
    /// @param batchIndex uint256 index of the specified batch in commitments array
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

    /// @dev Returns all pending (not yet executed) batch hashes and indices
    /// associated with a distributionEvent
    /// @param distributionEvent string Name of a new distribution event
    /// @return pendingBatchHashes bytes32[]
    /// @return pendingBatchIndices uint256[]
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

    /// @dev Transfers away any Orbs balance from this contract to the specified address
    /// @param to address address
    /// @return pendingBatchHashes bytes32[]
    /// @return pendingBatchIndices uint256[]
    function drainOrbs(address to) external onlyOwner {
        // TODO - TBD - allow draining only to owners account?
        require(to != address(0), "to address missing");
        uint256 balance = orbs.balanceOf(address(this));
        orbs.transfer(to, balance);
    }

    /// @dev Computes a hash code form a batch payment specification.
    /// @param recipients address[] a list of recipients addresses
    /// @param amounts uint256[] a list of amounts to transfer each recipient at the corresponding array index
    /// @param batchIndex uint256 index of the specified batch in commitments array
    function calcBatchHash(address[] recipients, uint256[] amounts, uint256 batchIndex) private pure returns (bytes32) {
        // TODO - do we really need recipients.length in the hash?...
        return keccak256(abi.encodePacked(batchIndex, recipients.length, recipients, amounts));
    }
}
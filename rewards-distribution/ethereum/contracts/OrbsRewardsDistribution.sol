pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./IOrbsRewardsDistribution.sol";

/// @title Orbs rewards distribution smart contract.
contract OrbsRewardsDistribution is Ownable, IOrbsRewardsDistribution {

    /// The Orbs token smart contract.
    IERC20 public orbs;

    struct Distribution {
        uint256 pendingBatchCount;
        bool hasPendingBatches;
        bytes32[] batchHashes;
    }

    /// Mapping of all ongoing distribution events.
    /// Distribution events are identified by a unique string
    /// for the duration of their execution.
    /// After completion or abortion the same name may be used again.
    mapping(string => Distribution) distributions;

    /// Address of an optional rewards-distributor account.
    /// Meant to be used in the future should an alternate implementation of
    /// batch-transfers locking mechanism will be needed, or for manual
    /// transfers without batch locking should be required.
    /// only the address of rewardsDistributor may call distributRewards()
    address public rewardsDistributor;

    /// indicates a new rewards distributor was selected.
    event RewardsDistributorReassigned(
        address indexed previousRewardsDistributor,
        address indexed newRewardsDistributor
    );

    /// @dev Constructor to set Orbs token contract address.
    /// @param _orbs IERC20 The address of the Orbs token contract.
    constructor(IERC20 _orbs) public {
        require(address(_orbs) != address(0), "Address must not be 0!");
        orbs = _orbs;
    }

    /// @dev Declares a new distribution event. Verifies a distribution
    /// event with the same name is not already ongoing, and records commitments
    /// for all reward payments in the form of batch hashes array to state.
    /// @param _distributionEvent string Name of a new distribution event
    /// @param _batchHashes bytes32[] The address of the OrbsValidators contract.
    function announceDistributionEvent(string _distributionEvent, bytes32[] _batchHashes) external onlyOwner {
        require(!distributions[_distributionEvent].hasPendingBatches, "named distribution is currently ongoing");
        require(_batchHashes.length > 0, "at least one batch must be announced");

        for (uint256 i = 0; i < _batchHashes.length; i++) {
            require(_batchHashes[i] != bytes32(0), "batch hash may not be 0x0");
        }

        // store distribution event record
        Distribution storage distribution = distributions[_distributionEvent];
        distribution.pendingBatchCount = _batchHashes.length;
        distribution.hasPendingBatches = true;
        distribution.batchHashes = _batchHashes;

        emit RewardsDistributionAnnounced(_distributionEvent, _batchHashes, _batchHashes.length);
    }

    /// @dev Aborts an ongoing distributionEvent and revokes all batch commitments.
    /// @param _distributionEvent string Name of a new distribution event
    function abortDistributionEvent(string _distributionEvent) external onlyOwner {
        require(distributions[_distributionEvent].hasPendingBatches, "named distribution is not currently ongoing");

        (bytes32[] memory abortedBatchHashes, uint256[] memory abortedBatchIndices) = this.getPendingBatches(_distributionEvent);

        delete distributions[_distributionEvent];

        emit RewardsDistributionAborted(_distributionEvent, abortedBatchHashes, abortedBatchIndices);
    }

    /// @dev Carry out and logs transfers in batch. receives two arrays of same length
    /// representing rewards payments for a list of reward recipients.
    /// distributionEvent is only provided for logging purposes.
    /// @param _distributionEvent string Name of a new distribution event
    /// @param _recipients address[] a list of recipients addresses
    /// @param _amounts uint256[] a list of amounts to transfer each recipient at the corresponding array index
    function _distributeRewards(string _distributionEvent, address[] _recipients, uint256[] _amounts) private {
        uint256 batchSize = _recipients.length;
        require(batchSize == _amounts.length, "array length mismatch");

        for (uint256 i = 0; i < batchSize; i++) {
            require(_recipients[i] != address(0), "recipient must be a valid address");
            require(orbs.transfer(_recipients[i], _amounts[i]), "transfer failed");
            emit RewardDistributed(_distributionEvent, _recipients[i], _amounts[i]);
        }
    }

    /// @dev Bypasses announcement/commitment process flow for batch payments.
    /// Requires owner privileges to execute. Provided as a mechanism for
    /// alternative batch commitment mechanisms if needed in the future.
    /// @param _distributionEvent string Name of a new distribution event
    /// @param _recipients address[] a list of recipients addresses
    /// @param _amounts uint256[] a list of amounts to transfer each recipient at the corresponding array index
    function distributeRewards(string _distributionEvent, address[] _recipients, uint256[] _amounts) external onlyRewardsDistributor {
        _distributeRewards(_distributionEvent, _recipients, _amounts);
    }

    /// @dev Accepts a batch of payments associated with a distributionEvent.
    /// Once validated against the batch hash commitment, the batch is cleared from commitment array
    /// and executed.
    /// If this was the last batch in distributionEvent, the record is
    /// cleared and distributionEvent is logged as completed.
    /// @param _distributionEvent string Name of a new distribution event
    /// @param _recipients address[] a list of recipients addresses
    /// @param _amounts uint256[] a list of amounts to transfer each recipient at the corresponding array index
    /// @param _batchIndex uint256 index of the specified batch in commitments array
    function executeCommittedBatch(string _distributionEvent, address[] _recipients, uint256[] _amounts, uint256 _batchIndex) external {
        Distribution storage distribution = distributions[_distributionEvent];
        bytes32[] storage batchHashes = distribution.batchHashes;

        require(_recipients.length == _amounts.length, "array length mismatch");
        require(_recipients.length > 0, "at least one reward must be included in a batch");
        require(distribution.hasPendingBatches, "distribution is not currently ongoing");
        require(batchHashes.length > _batchIndex, "batch number out of range");
        require(batchHashes[_batchIndex] != bytes32(0), "specified batch number already executed");

        bytes32 calculatedHash = calcBatchHash(_recipients, _amounts, _batchIndex);
        require(batchHashes[_batchIndex] == calculatedHash, "batch hash does not match");

        distribution.pendingBatchCount--;
        batchHashes[_batchIndex] = bytes32(0); // delete

        _distributeRewards(_distributionEvent, _recipients, _amounts);

        emit RewardsBatchExecuted(_distributionEvent, calculatedHash, _batchIndex);

        if (distribution.pendingBatchCount == 0) {
            delete distributions[_distributionEvent];
            emit RewardsDistributionCompleted(_distributionEvent);
        }
    }

    /// @dev Returns all pending (not yet executed) batch hashes and indices
    /// associated with a distributionEvent
    /// @param _distributionEvent string Name of a new distribution event
    /// @return pendingBatchHashes bytes32[]
    /// @return pendingBatchIndices uint256[]
    function getPendingBatches(string _distributionEvent) external view returns (bytes32[] pendingBatchHashes, uint256[] pendingBatchIndices) {
        Distribution storage distribution = distributions[_distributionEvent];
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

    /// @dev For disaster recovery purposes.
    /// Transfers away any Orbs balance from this contract to the owners address
    function drainOrbs() external onlyOwner {
        uint256 balance = orbs.balanceOf(address(this));
        orbs.transfer(owner(), balance);
    }

    /// @dev Transfers control of the contract to a newOwner.
    /// @param _newRewardsDistributor The address to set as the new rewards-distributor.
    function reassignRewardsDistributor(address _newRewardsDistributor) public onlyOwner {
        emit RewardsDistributorReassigned(rewardsDistributor, _newRewardsDistributor);
        rewardsDistributor = _newRewardsDistributor;
    }

    /// return true if `msg.sender` is the assigned rewards-distributor.
    function isRewardsDistributor() public view returns(bool) {
        return msg.sender == rewardsDistributor;
    }

    ///@dev Throws if called by any account other than the rewards-distributor.
    modifier onlyRewardsDistributor() {
        require(isRewardsDistributor(), "only the assigned rewards-distributor may call this method");
        _;
    }

    /// @dev Computes a hash code form a batch payment specification.
    /// @param _recipients address[] a list of recipients addresses
    /// @param _amounts uint256[] a list of amounts to transfer each recipient at the corresponding array index
    /// @param _batchIndex uint256 index of the specified batch in commitments array
    function calcBatchHash(address[] _recipients, uint256[] _amounts, uint256 _batchIndex) private pure returns (bytes32) {
        // TODO - do length checks
        return keccak256(abi.encodePacked(_batchIndex, _recipients.length, _recipients, _amounts));
    }
}
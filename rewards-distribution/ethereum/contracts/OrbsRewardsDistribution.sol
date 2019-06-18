pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./IOrbsRewardsDistribution.sol";

contract OrbsRewardsDistribution is Ownable, IOrbsRewardsDistribution {

    // The Orbs token smart contract.
    IERC20 public orbs;

    constructor(IERC20 _orbs) public {
        require(address(_orbs) != address(0), "Address must not be 0!");
        orbs = _orbs;
    }

    function announceDistributionEvent(string distributionName, bytes32[] batchHashes) external onlyOwner {

    }

    function abortDistributionEvent(string distributionName) external onlyOwner {

    }

    function distributeFees(string distributionName, address[] recipients, uint256[] amounts) external onlyOwner {

    }

    function executeCommittedBatch(string distributionName, address[] recipients, uint256[] amounts, uint32 batchNum) external {

    }


    function getOngoingDistributionEvents() external returns (string delimitedNames, bytes32[] pendingBatches) {

    }

    function drainOrbs(address to) external onlyOwner {

    }

    function calcBatchHash(string distributionName, address[] recipients, uint256[] amounts, uint32 batchNum) private pure returns (bytes32) {
        return 0;
    }
}
pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./IOrbsRewardsDistribution.sol";

contract OrbsRewardsDistribution is Ownable, IOrbsRewardsDistribution {

    // The Orbs token smart contract.
    IERC20 public orbs;

    constructor(IERC20 _orbs) public{
        require(address(_orbs) != address(0), "Address must not be 0!");
        orbs = _orbs;
    }

    function commitDistributionEvent(string distributionName, bytes32[] batchHashes) public only_owner {

    }

    function abortDistributionEvent(string distributionName) public only_owner {

    }

    function distributeFees(string distributionName, address[] recipients, uint256[] amounts) public only_owner {

    }

    function executeCommittedBatch(string distributionName, address[] recipients, uint256[] amounts, uint32 batchNum) public {

    }

    function drainOrbs(address to) pubic only_owner {

    }

    function calcBatchHash(string distributionName, address[] recipients, uint256[] amounts, uint32 batchNum) private pure returns (bytes32) {
        return 0;
    }
}
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
    }

    function abortDistributionEvent(string distributionName) external onlyOwner {

    }

    function distributeFees(string distributionName, address[] recipients, uint256[] amounts) external onlyOwner {

    }

    function executeCommittedBatch(string distributionName, address[] recipients, uint256[] amounts, uint256 batchNum) external {
        Distribution storage distribution = distributions[distributionName];

        require(recipients.length == amounts.length, "array length mismatch");
        require(recipients.length >= 1, "at least one reward must be included in a batch");
        require(distribution.totalBatches > 0, "distribution is not currently ongoing");
        require(distribution.totalBatches >= batchNum, "batch number out of range");

        // TODO - calculate hash and validate it. then remove it from batchHashes
        bytes32 calculatedHash = calcBatchHash(recipients, amounts, batchNum);
        require(distribution.batchHashes[batchNum] == calculatedHash, "batch hash does not match");
        delete distribution.batchHashes[batchNum];

        distribution.pendingBatches--;
        if (distribution.pendingBatches == 0) {
            delete distributions[distributionName];
        }

        uint256 batchSize = recipients.length;
        for (uint256 i = 0; i < batchSize; i++) {
            orbs.transfer(recipients[i], amounts[i]);
            emit RewardsDistributed(distributionName, recipients[i], amounts[i]);
        }
    }

    function getOngoingDistributionEvents() external view returns (string delimitedNames) {

    }

    function getPendingBatches(string distributionName) external view returns (bytes32[] pendingBatches) {
        Distribution storage distribution = distributions[distributionName];

        pendingBatches = new bytes32[](distribution.totalBatches);

        mapping(uint256 => bytes32) batchHashes = distribution.batchHashes;

        for (uint256 i = 0; i < pendingBatches.length; i++) {
            pendingBatches[i] = batchHashes[i];
        }
    }

    function drainOrbs(address to) external onlyOwner {

    }

    function calcBatchHash(address[] recipients, uint256[] amounts, uint256 batchNum) private pure returns (bytes32) {
        string memory data = string(abi.encodePacked(uintToString(batchNum), ":"));
        for (uint i = 0; i < recipients.length; i++) {
            data = string(abi.encodePacked(data, addressToString(recipients[i]), uintToString(amounts[i]), "_"));
        }
        return keccak256(data);
    }

    function uintToString(uint i) internal pure returns (string){
        if (i == 0) return "0";
        uint j = i;
        uint length;
        while (j != 0){
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint k = length - 1;
        while (i != 0){
            bstr[k--] = byte(48 + i % 10);
            i /= 10;
        }
        return string(bstr);
    }

    function addressToString(address _addr) public pure returns(string) {
        bytes32 value = bytes32(uint256(_addr));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
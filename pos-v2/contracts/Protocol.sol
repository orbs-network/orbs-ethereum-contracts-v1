pragma solidity 0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "./interfaces/IProtocol.sol";

contract Protocol is IProtocol, Ownable {

    // TODO - allow amending future upgrades - see https://github.com/orbs-network/orbs-ethereum-contracts/pull/192#discussion_r391179003

    struct DeploymentSubset {
        bool exists;
        uint version;
        uint asOfBlock;
    }

    mapping (string => DeploymentSubset) deploymentSubsets;

    function deploymentSubsetExists(string memory deploymentSubset) public view returns (bool) {
        return deploymentSubsets[deploymentSubset].exists;
    }

    function setProtocolVersion(string calldata deploymentSubset, uint256 protocolVersion, uint256 asOfBlock) external onlyOwner {
        if (deploymentSubsets[deploymentSubset].version == 0) {
            require(asOfBlock == 0, "initial protocol version must be from block 0");
        } else {
            require(asOfBlock > block.number, "protocol update can only take place in the future");
            require(asOfBlock > deploymentSubsets[deploymentSubset].asOfBlock, "protocol upgrade can only take place after the previous protocol update");
            require(protocolVersion > deploymentSubsets[deploymentSubset].version, "protocol downgrade is not supported");
        }

        deploymentSubsets[deploymentSubset].version = protocolVersion;
        deploymentSubsets[deploymentSubset].asOfBlock = asOfBlock;
        deploymentSubsets[deploymentSubset].exists = true;

        emit ProtocolVersionChanged(deploymentSubset, protocolVersion, asOfBlock);
    }
}

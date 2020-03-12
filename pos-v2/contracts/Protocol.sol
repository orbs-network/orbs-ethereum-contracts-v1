pragma solidity 0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";

contract Protocol is Ownable {

    event ProtocolVersionChanged(string deploymentSubset, uint256 protocolVersion, uint256 asOfBlock);

    struct DeploymentSubset {
        uint version;
        uint asOfBlock;
    }

    mapping (string => DeploymentSubset) deploymentSubsets;
    address governor;

    constructor() public {
    }

    function deploymentSubsetExists(string calldata deploymentSubset) external view returns (bool) {
        return deploymentSubsets[deploymentSubset].version > 0;
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

        emit ProtocolVersionChanged(deploymentSubset, protocolVersion, asOfBlock);
    }
}

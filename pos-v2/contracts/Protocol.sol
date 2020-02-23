pragma solidity 0.5.16;

contract Protocol {

    event ProtocolVersionChanged(string deploymentSubset, uint256 protocolVersion, uint256 asOfBlock);

    struct DeploymentSubset {
        uint version;
        uint asOfBlock;
    }

    mapping (string => DeploymentSubset) deploymentSubsets;
    address governor;

    modifier onlyGovernor() {
        require(msg.sender == governor, "caller is not the protocol contract governor");

        _;
    }

    constructor(address _governor) public {
        governor = _governor;
    }

    function deploymentSubsetExists(string calldata deploymentSubset) external view returns (bool) {
        return deploymentSubsets[deploymentSubset].version > 0;
    }

    function setProtocolVersion(string calldata deploymentSubset, uint256 protocolVersion, uint256 asOfBlock) external onlyGovernor {
        if (deploymentSubsets[deploymentSubset].version == 0) {
            require(asOfBlock == 0, "initial protocol version must be from block 0");
        } else {
            require(asOfBlock > block.number, "protocol update can only take place in the future");
            require(asOfBlock > deploymentSubsets[deploymentSubset].asOfBlock, "protocol upgrade can only take place after the previous protocol update");
            require(protocolVersion > deploymentSubsets[deploymentSubset].version, "protocol downgrade is not supported"); // TODO should we enforce it?
            // TODO check that is it scheduled not to close to the present?
            // TODO check that is it scheduled not to far into the future?
            // TODO check that the protocol version is not too far ahead?
        }

        deploymentSubsets[deploymentSubset].version = protocolVersion;
        deploymentSubsets[deploymentSubset].asOfBlock = asOfBlock;

        emit ProtocolVersionChanged(deploymentSubset, protocolVersion, asOfBlock);
    }

    function setGovernor(address newGovernor) external onlyGovernor {
        require(newGovernor != address(0), "governor must not be zero");
        governor = newGovernor;
    }
}

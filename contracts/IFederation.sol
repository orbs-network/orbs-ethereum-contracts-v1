pragma solidity 0.4.24;


/// @title Federation interface.
interface IFederation {
    /// @dev Returns whether a specific member exists in the federation.
    /// @param _member address The public address of the member to check.
    function isMember(address _member) external view returns (bool);

    /// @dev Returns the federation members.
    function getMembers() external view returns (address[]);

    /// @dev Returns the required threshold for consensus.
    function getConsensusThreshold() external view returns (uint);

    /// @dev Returns the revision of the current federation.
    function getFederationRevision() external view returns (uint);

    /// @dev Returns the federation members by revision.
    /// @param _federationRevision uint The revision to query.
    function getMembersByRevision(uint _federationRevision) external view returns (address[]);

    /// @dev Returns the required threshold for consensus by revision.
    /// @param _federationRevision uint The revision to query.
    function getConsensusThresholdByRevision(uint _federationRevision) external view returns (uint);
}

pragma solidity 0.4.24;


/// @title Federation interface.
interface IFederation {
    /// @dev Returns the federation members.
    function getMembers() external view returns (address[]);

    /// @dev Returns the required threshold for consensus.
    function getConsensusThreshold() external view returns (uint);
}

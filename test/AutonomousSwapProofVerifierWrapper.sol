pragma solidity 0.4.24;

import "../contracts/AutonomousSwapProofVerifier.sol";


/// @dev Contract wrapper around AutonomousSwapProofVerifier. Please note that this is only required in order to support
/// solidity-coverage.
contract AutonomousSwapProofVerifierWrapper {
    function getVersion() public pure returns(string) {
        return AutonomousSwapProofVerifier.getVersion();
    }

    function processProof(bytes _proof) public pure returns(bytes20 from, address to, uint256 value, uint256 tuid) {
        return AutonomousSwapProofVerifier.processProof(_proof);
    }

    function isECDSASignatureValid(bytes32 _hash, bytes _signature, address _address) public pure returns (bool) {
        return AutonomousSwapProofVerifier.isECDSASignatureValid(_hash, _signature, _address);
    }
}

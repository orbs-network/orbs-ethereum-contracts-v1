pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../contracts/AutonomousSwapBridge.sol";


/// @title Autonomous Swap Bridge (ASB) smart contract.
contract AutonomousSwapBridgeWrapper is AutonomousSwapBridge {
    constructor(uint32 _networkType, uint64 _virtualChainId, string _orbsASBContractName, IERC20 _token,
        IFederation _federation, IAutonomousSwapProofVerifier _verifier) public AutonomousSwapBridge(
        _networkType, _virtualChainId, _orbsASBContractName, _token, _federation, _verifier) {
        }

    function injectTransferIn(uint64 _tuid, bytes20 _from, address _to, uint256 _value) public {
        spentOrbsTuids[_tuid] = true;
        if (_tuid > maxOrbsTuid) {
            maxOrbsTuid = _tuid;
        }
        emit EthTransferredIn(_tuid, _from, _to, _value);
    }
}


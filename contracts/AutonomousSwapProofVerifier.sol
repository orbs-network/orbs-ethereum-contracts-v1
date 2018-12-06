pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "solidity-bytes-utils/contracts/BytesLib.sol";

import "./IAutonomousSwapProofVerifier.sol";
import "./BytesLibEx.sol";
import "./CryptoUtils.sol";


/// @title ASB proof verification library
contract AutonomousSwapProofVerifier is IAutonomousSwapProofVerifier {
    using SafeMath for uint256;
    using BytesLib for bytes;
    using BytesLibEx for bytes;

    // The version of the current proof verifier library.
    string public constant VERSION = "0.1";

    // Data sizes (in bytes).
    uint public constant UINT32_SIZE = 4;
    uint public constant UINT64_SIZE = 8;
    uint public constant UINT256_SIZE = 32;
    uint public constant ADDRESS_SIZE = 20;

    /// @dev Parses and validates the raw transfer proof.
    /// @param _proof bytes The raw transfer proof.
    /// @return from bytes20 from The Orbs address to transfer from.
    /// @return to address The address to transfer to.
    /// @return value uint256 The amount to be transferred.
    /// @return networkId The network ID of the Orbs network this contract is compatible for.
    /// @return virtualChainId uint64 The virtual chain ID of the underlying token on the Orbs network.
    /// @return tuid uint256 The TUID of the corresponding transaction.
    function processProof(bytes _proof) public pure returns(bytes20 from, address to, uint256 value,
        uint32 networkId, uint64 virtualChainId, uint256 tuid) {
        // TODO: implement the finalized proof spec.
    }

    /// @dev Parses Autonomous Swap Event Data according to:
    /// +----------------------+--------+------+------------+
    /// |        Field         | Offset | Size |  Encoding  |
    /// +----------------------+--------+------+------------+
    /// | contract name length | 0      | 4    | uint32     |
    /// | contract name        | 4      | N    | string     |
    /// | event_id             | TBD    | 4    | uint32     |
    /// | tuid                 | TBD    | 8    | uint64     |
    /// | ethereum_address     | TBD    | 20   | bytes(20B) |
    /// | tokens               | TBD    | 32   | bytes(32B) |
    /// +----------------------+--------+------+------------+
    /// @param _eventData bytes The serialized event data.
    /// @return contractName string The name of Orbs contract name which has emitted the event.
    /// @return eventId uint32 The ID of the event (enum).
    /// @return tuid uint64 The Orbs TUID corresponding to the event.
    /// @return to address The address to transfer to.
    /// @return uint256 The amount to be transferred.
    function parseEventData(bytes _eventData) public view returns (string orbsContractName, uint32 eventId, uint64 tuid,
        address to, uint256 value) {
        uint offset = 0;

        uint32 orbsContractNameLength = _eventData.toUint32BE(0);
        offset = offset.add(UINT32_SIZE);
        orbsContractName = string(_eventData.slice(offset, orbsContractNameLength));
        offset = offset.add(orbsContractNameLength);

        eventId = uint32(_eventData.toUint32BE(offset));
        offset = offset.add(UINT32_SIZE);

        tuid = uint64(_eventData.toUint64BE(offset));
        offset = offset.add(UINT64_SIZE);

        to = _eventData.toAddress(offset);
        offset = offset.add(ADDRESS_SIZE);

        value = _eventData.toUintBE(offset);
        offset = offset.add(UINT256_SIZE);
    }

    /// @dev Checks Orbs address for correctness.
    /// @param _address bytes20 The Orbs address to check.
    function isOrbsAddressValid(bytes20 _address) public pure returns (bool) {
        // Check for empty address.
        if (_address == bytes20(0)) {
            return false;
        }

        return true;
    }

    // Debug
    event XXX(bytes data);
    event AAA(uint32 i);
    event BBB(uint64 i);
    event CCC(uint256 i);
}

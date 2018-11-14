pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/cryptography/MerkleProof.sol";

import "solidity-bytes-utils/contracts/BytesLib.sol";


/// @title ASB proof verification library
library AutonomousSwapProofVerifier {
    using SafeMath for uint256;
    using BytesLib for bytes;
}

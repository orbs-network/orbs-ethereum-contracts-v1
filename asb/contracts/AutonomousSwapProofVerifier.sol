pragma solidity 0.4.24;

// File: openzeppelin-solidity/contracts/math/SafeMath.sol

/**
 * @title SafeMath
 * @dev Math operations with safety checks that revert on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, reverts on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b);

    return c;
  }

  /**
  * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b > 0); // Solidity only automatically asserts when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  /**
  * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a);
    uint256 c = a - b;

    return c;
  }

  /**
  * @dev Adds two numbers, reverts on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);

    return c;
  }

  /**
  * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
  * reverts when dividing by zero.
  */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0);
    return a % b;
  }
}

// File: solidity-bytes-utils/contracts/BytesLib.sol

/*
 * @title Solidity Bytes Arrays Utils
 * @author Gonçalo Sá <goncalo.sa@consensys.net>
 *
 * @dev Bytes tightly packed arrays utility library for ethereum contracts written in Solidity.
 *      The library lets you concatenate, slice and type cast bytes arrays both in memory and storage.
 */

pragma solidity ^0.4.19;


library BytesLib {
    function concat(bytes memory _preBytes, bytes memory _postBytes) internal pure returns (bytes) {
        bytes memory tempBytes;

        assembly {
            // Get a location of some free memory and store it in tempBytes as
            // Solidity does for memory variables.
            tempBytes := mload(0x40)

            // Store the length of the first bytes array at the beginning of
            // the memory for tempBytes.
            let length := mload(_preBytes)
            mstore(tempBytes, length)

            // Maintain a memory counter for the current write location in the
            // temp bytes array by adding the 32 bytes for the array length to
            // the starting location.
            let mc := add(tempBytes, 0x20)
            // Stop copying when the memory counter reaches the length of the
            // first bytes array.
            let end := add(mc, length)

            for {
                // Initialize a copy counter to the start of the _preBytes data,
                // 32 bytes into its memory.
                let cc := add(_preBytes, 0x20)
            } lt(mc, end) {
                // Increase both counters by 32 bytes each iteration.
                mc := add(mc, 0x20)
                cc := add(cc, 0x20)
            } {
                // Write the _preBytes data into the tempBytes memory 32 bytes
                // at a time.
                mstore(mc, mload(cc))
            }

            // Add the length of _postBytes to the current length of tempBytes
            // and store it as the new length in the first 32 bytes of the
            // tempBytes memory.
            length := mload(_postBytes)
            mstore(tempBytes, add(length, mload(tempBytes)))

            // Move the memory counter back from a multiple of 0x20 to the
            // actual end of the _preBytes data.
            mc := end
            // Stop copying when the memory counter reaches the new combined
            // length of the arrays.
            end := add(mc, length)

            for {
                let cc := add(_postBytes, 0x20)
            } lt(mc, end) {
                mc := add(mc, 0x20)
                cc := add(cc, 0x20)
            } {
                mstore(mc, mload(cc))
            }

            // Update the free-memory pointer by padding our last write location
            // to 32 bytes: add 31 bytes to the end of tempBytes to move to the
            // next 32 byte block, then round down to the nearest multiple of
            // 32. If the sum of the length of the two arrays is zero then add
            // one before rounding down to leave a blank 32 bytes (the length block with 0).
            mstore(0x40, and(
              add(add(end, iszero(add(length, mload(_preBytes)))), 31),
              not(31) // Round down to the nearest 32 bytes.
            ))
        }

        return tempBytes;
    }

    function concatStorage(bytes storage _preBytes, bytes memory _postBytes) internal {
        assembly {
            // Read the first 32 bytes of _preBytes storage, which is the length
            // of the array. (We don't need to use the offset into the slot
            // because arrays use the entire slot.)
            let fslot := sload(_preBytes_slot)
            // Arrays of 31 bytes or less have an even value in their slot,
            // while longer arrays have an odd value. The actual length is
            // the slot divided by two for odd values, and the lowest order
            // byte divided by two for even values.
            // If the slot is even, bitwise and the slot with 255 and divide by
            // two to get the length. If the slot is odd, bitwise and the slot
            // with -1 and divide by two.
            let slength := div(and(fslot, sub(mul(0x100, iszero(and(fslot, 1))), 1)), 2)
            let mlength := mload(_postBytes)
            let newlength := add(slength, mlength)
            // slength can contain both the length and contents of the array
            // if length < 32 bytes so let's prepare for that
            // v. http://solidity.readthedocs.io/en/latest/miscellaneous.html#layout-of-state-variables-in-storage
            switch add(lt(slength, 32), lt(newlength, 32))
            case 2 {
                // Since the new array still fits in the slot, we just need to
                // update the contents of the slot.
                // uint256(bytes_storage) = uint256(bytes_storage) + uint256(bytes_memory) + new_length
                sstore(
                    _preBytes_slot,
                    // all the modifications to the slot are inside this
                    // next block
                    add(
                        // we can just add to the slot contents because the
                        // bytes we want to change are the LSBs
                        fslot,
                        add(
                            mul(
                                div(
                                    // load the bytes from memory
                                    mload(add(_postBytes, 0x20)),
                                    // zero all bytes to the right
                                    exp(0x100, sub(32, mlength))
                                ),
                                // and now shift left the number of bytes to
                                // leave space for the length in the slot
                                exp(0x100, sub(32, newlength))
                            ),
                            // increase length by the double of the memory
                            // bytes length
                            mul(mlength, 2)
                        )
                    )
                )
            }
            case 1 {
                // The stored value fits in the slot, but the combined value
                // will exceed it.
                // get the keccak hash to get the contents of the array
                mstore(0x0, _preBytes_slot)
                let sc := add(keccak256(0x0, 0x20), div(slength, 32))

                // save new length
                sstore(_preBytes_slot, add(mul(newlength, 2), 1))

                // The contents of the _postBytes array start 32 bytes into
                // the structure. Our first read should obtain the `submod`
                // bytes that can fit into the unused space in the last word
                // of the stored array. To get this, we read 32 bytes starting
                // from `submod`, so the data we read overlaps with the array
                // contents by `submod` bytes. Masking the lowest-order
                // `submod` bytes allows us to add that value directly to the
                // stored value.

                let submod := sub(32, slength)
                let mc := add(_postBytes, submod)
                let end := add(_postBytes, mlength)
                let mask := sub(exp(0x100, submod), 1)

                sstore(
                    sc,
                    add(
                        and(
                            fslot,
                            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00
                        ),
                        and(mload(mc), mask)
                    )
                )

                for {
                    mc := add(mc, 0x20)
                    sc := add(sc, 1)
                } lt(mc, end) {
                    sc := add(sc, 1)
                    mc := add(mc, 0x20)
                } {
                    sstore(sc, mload(mc))
                }

                mask := exp(0x100, sub(mc, end))

                sstore(sc, mul(div(mload(mc), mask), mask))
            }
            default {
                // get the keccak hash to get the contents of the array
                mstore(0x0, _preBytes_slot)
                // Start copying to the last used word of the stored array.
                let sc := add(keccak256(0x0, 0x20), div(slength, 32))

                // save new length
                sstore(_preBytes_slot, add(mul(newlength, 2), 1))

                // Copy over the first `submod` bytes of the new data as in
                // case 1 above.
                let slengthmod := mod(slength, 32)
                let mlengthmod := mod(mlength, 32)
                let submod := sub(32, slengthmod)
                let mc := add(_postBytes, submod)
                let end := add(_postBytes, mlength)
                let mask := sub(exp(0x100, submod), 1)

                sstore(sc, add(sload(sc), and(mload(mc), mask)))

                for {
                    sc := add(sc, 1)
                    mc := add(mc, 0x20)
                } lt(mc, end) {
                    sc := add(sc, 1)
                    mc := add(mc, 0x20)
                } {
                    sstore(sc, mload(mc))
                }

                mask := exp(0x100, sub(mc, end))

                sstore(sc, mul(div(mload(mc), mask), mask))
            }
        }
    }

    function slice(bytes _bytes, uint _start, uint _length) internal  pure returns (bytes) {
        require(_bytes.length >= (_start + _length));

        bytes memory tempBytes;

        assembly {
            switch iszero(_length)
            case 0 {
                // Get a location of some free memory and store it in tempBytes as
                // Solidity does for memory variables.
                tempBytes := mload(0x40)

                // The first word of the slice result is potentially a partial
                // word read from the original array. To read it, we calculate
                // the length of that partial word and start copying that many
                // bytes into the array. The first word we copy will start with
                // data we don't care about, but the last `lengthmod` bytes will
                // land at the beginning of the contents of the new array. When
                // we're done copying, we overwrite the full first word with
                // the actual length of the slice.
                let lengthmod := and(_length, 31)

                // The multiplication in the next line is necessary
                // because when slicing multiples of 32 bytes (lengthmod == 0)
                // the following copy loop was copying the origin's length
                // and then ending prematurely not copying everything it should.
                let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
                let end := add(mc, _length)

                for {
                    // The multiplication in the next line has the same exact purpose
                    // as the one above.
                    let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)
                } lt(mc, end) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                    mstore(mc, mload(cc))
                }

                mstore(tempBytes, _length)

                //update free-memory pointer
                //allocating the array padded to 32 bytes like the compiler does now
                mstore(0x40, and(add(mc, 31), not(31)))
            }
            //if we want a zero-length slice let's just return a zero-length array
            default {
                tempBytes := mload(0x40)

                mstore(0x40, add(tempBytes, 0x20))
            }
        }

        return tempBytes;
    }

    function toAddress(bytes _bytes, uint _start) internal  pure returns (address) {
        require(_bytes.length >= (_start + 20));
        address tempAddress;

        assembly {
            tempAddress := div(mload(add(add(_bytes, 0x20), _start)), 0x1000000000000000000000000)
        }

        return tempAddress;
    }

    function toUint(bytes _bytes, uint _start) internal  pure returns (uint256) {
        require(_bytes.length >= (_start + 32));
        uint256 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x20), _start))
        }

        return tempUint;
    }

    function toBytes32(bytes _bytes, uint _start) internal  pure returns (bytes32) {
        require(_bytes.length >= (_start + 32));
        bytes32 tempBytes32;

        assembly {
            tempBytes32 := mload(add(add(_bytes, 0x20), _start))
        }

        return tempBytes32;
    }

    function equal(bytes memory _preBytes, bytes memory _postBytes) internal pure returns (bool) {
        bool success = true;

        assembly {
            let length := mload(_preBytes)

            // if lengths don't match the arrays are not equal
            switch eq(length, mload(_postBytes))
            case 1 {
                // cb is a circuit breaker in the for loop since there's
                //  no said feature for inline assembly loops
                // cb = 1 - don't breaker
                // cb = 0 - break
                let cb := 1

                let mc := add(_preBytes, 0x20)
                let end := add(mc, length)

                for {
                    let cc := add(_postBytes, 0x20)
                // the next line is the loop condition:
                // while(uint(mc < end) + cb == 2)
                } eq(add(lt(mc, end), cb), 2) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                    // if any of these checks fails then arrays are not equal
                    if iszero(eq(mload(mc), mload(cc))) {
                        // unsuccess:
                        success := 0
                        cb := 0
                    }
                }
            }
            default {
                // unsuccess:
                success := 0
            }
        }

        return success;
    }

    function equalStorage(bytes storage _preBytes, bytes memory _postBytes) internal view returns (bool) {
        bool success = true;

        assembly {
            // we know _preBytes_offset is 0
            let fslot := sload(_preBytes_slot)
            // Decode the length of the stored array like in concatStorage().
            let slength := div(and(fslot, sub(mul(0x100, iszero(and(fslot, 1))), 1)), 2)
            let mlength := mload(_postBytes)

            // if lengths don't match the arrays are not equal
            switch eq(slength, mlength)
            case 1 {
                // slength can contain both the length and contents of the array
                // if length < 32 bytes so let's prepare for that
                // v. http://solidity.readthedocs.io/en/latest/miscellaneous.html#layout-of-state-variables-in-storage
                if iszero(iszero(slength)) {
                    switch lt(slength, 32)
                    case 1 {
                        // blank the last byte which is the length
                        fslot := mul(div(fslot, 0x100), 0x100)

                        if iszero(eq(fslot, mload(add(_postBytes, 0x20)))) {
                            // unsuccess:
                            success := 0
                        }
                    }
                    default {
                        // cb is a circuit breaker in the for loop since there's
                        //  no said feature for inline assembly loops
                        // cb = 1 - don't breaker
                        // cb = 0 - break
                        let cb := 1

                        // get the keccak hash to get the contents of the array
                        mstore(0x0, _preBytes_slot)
                        let sc := keccak256(0x0, 0x20)

                        let mc := add(_postBytes, 0x20)
                        let end := add(mc, mlength)

                        // the next line is the loop condition:
                        // while(uint(mc < end) + cb == 2)
                        for {} eq(add(lt(mc, end), cb), 2) {
                            sc := add(sc, 1)
                            mc := add(mc, 0x20)
                        } {
                            if iszero(eq(sload(sc), mload(mc))) {
                                // unsuccess:
                                success := 0
                                cb := 0
                            }
                        }
                    }
                }
            }
            default {
                // unsuccess:
                success := 0
            }
        }

        return success;
    }
}

// File: contracts/IAutonomousSwapProofVerifier.sol

pragma experimental ABIEncoderV2;


/// @title AutonomousSwapProofVerifier interface.
/// Please note that we had to implement it as an abstract contract, rather than an interface, due to Solidity's
/// inability to contain structs in interface and it's inability to support unbound parameters (e.g., bytes) in external
/// interface methods
contract IAutonomousSwapProofVerifier {
    struct TransferInEvent {
        uint32 networkType;
        uint64 virtualChainId;
        string orbsContractName;
        bytes20 from;
        address to;
        uint256 value;
        uint256 tuid;
    }

    /// @dev Parses and validates the raw transfer proof. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _resultsBlockHeader bytes The raw Results Block Header.
    /// @param _resultsBlockProof bytes The raw Results Block Proof.
    /// @param _transactionReceipt bytes The raw Transaction Receipt.
    /// @return transferInEvent TransferInEvent The TransferIn event data.
    function processProof(bytes _resultsBlockHeader, bytes _resultsBlockProof, bytes _transactionReceipt,
        bytes32[] _transactionReceiptProof) public view returns(TransferInEvent memory transferInEvent);

    /// @dev Checks Orbs address for correctness. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _address bytes20 The Orbs address to check.
    function isOrbsAddressValid(bytes20 _address) public pure returns (bool);
}

// File: contracts/IFederation.sol

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

    /// @dev Returns whether a specific member exists in the federation by revision.
    /// @param _federationRevision uint The revision to query.
    /// @param _member address The public address of the member to check.
    function isMemberByRevision(uint _federationRevision, address _member) external view returns (bool);

    /// @dev Returns the federation members by revision.
    /// @param _federationRevision uint The revision to query.
    function getMembersByRevision(uint _federationRevision) external view returns (address[]);

    /// @dev Returns the required threshold for consensus by revision.
    /// @param _federationRevision uint The revision to query.
    function getConsensusThresholdByRevision(uint _federationRevision) external view returns (uint);
}

// File: contracts/BytesLibEx.sol

/// @title Extension to the BytesLib library.
library BytesLibEx {
    using BytesLib for bytes;

    // Data sizes (in bytes).
    uint public constant UINT32_SIZE = 4;
    uint public constant UINT64_SIZE = 8;
    uint public constant UINT256_SIZE = 32;
    uint public constant BYTES20_SIZE = 20;

    /// @dev Converts a bytes array to byte20.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toBytes20(bytes memory _bytes, uint _start) internal pure returns (bytes20) {
        require(_bytes.length >= _start + BYTES20_SIZE, "Invalid length!");

        bytes20 tempBytes20;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            tempBytes20 := mload(add(add(_bytes, 32), _start))
        }

        return tempBytes20;
    }

    /// @dev Converts a bytes array to a uint32.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint32(bytes memory _bytes, uint _start) internal pure returns (uint32) {
        return uint32(toUint(_bytes, _start, UINT32_SIZE));
    }

    /// @dev Converts a bytes array to a uint64.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint64(bytes memory _bytes, uint _start) internal pure returns (uint64) {
        return uint64(toUint(_bytes, _start, UINT64_SIZE));
    }

    /// @dev Converts a big-endian bytes array to a uint32.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint32BE(bytes memory _bytes, uint _start) internal pure returns (uint32) {
        return uint32(toUintBE(_bytes, _start, UINT32_SIZE));
    }

    /// @dev Converts a big-endian bytes array to a uint64.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint64BE(bytes memory _bytes, uint _start) internal pure returns (uint64) {
        return uint64(toUintBE(_bytes, _start, UINT64_SIZE));
    }

    /// @dev Converts a bytes array to a uint of specific size.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUintBE(bytes memory _bytes, uint _start) internal pure returns (uint) {
        return uint(toUintBE(_bytes, _start, UINT256_SIZE));
    }

    /// @dev Converts a bytes array to a uint of specific size.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUint(bytes memory _bytes, uint _start, uint _size) private pure returns (uint) {
        require(_bytes.length >= _start + _size, "Invalid length!");

        uint tempUint;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            tempUint := mload(add(add(_bytes, _size), _start))
        }

        return tempUint;
    }

    /// @dev Reverses the endianness of a given byte array.
    /// @param _bytes bytes The bytes to reverse.
    function switchEndianness(bytes memory _bytes) private pure returns (bytes) {
        bytes memory newBytes = new bytes(_bytes.length);

        for (uint i = 0; i < _bytes.length; ++i) {
            newBytes[_bytes.length - i - 1] = _bytes[i];
        }

        return newBytes;
    }

    /// @dev Converts a big-endian bytes array to a uint of specific size.
    /// @param _bytes bytes The raw buffer.
    /// @param _start uint The offset to start from.
    function toUintBE(bytes memory _bytes, uint _start, uint _size) private pure returns (uint) {
        bytes memory newBytes = switchEndianness(_bytes.slice(_start, _size));
        return toUint(newBytes, 0, _size);
    }
}

// File: openzeppelin-solidity/contracts/cryptography/ECDSA.sol

/**
 * @title Elliptic curve signature operations
 * @dev Based on https://gist.github.com/axic/5b33912c6f61ae6fd96d6c4a47afde6d
 * TODO Remove this library once solidity supports passing a signature to ecrecover.
 * See https://github.com/ethereum/solidity/issues/864
 */

library ECDSA {

  /**
   * @dev Recover signer address from a message by using their signature
   * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
   * @param signature bytes signature, the signature is generated using web3.eth.sign()
   */
  function recover(bytes32 hash, bytes signature)
    internal
    pure
    returns (address)
  {
    bytes32 r;
    bytes32 s;
    uint8 v;

    // Check the signature length
    if (signature.length != 65) {
      return (address(0));
    }

    // Divide the signature in r, s and v variables
    // ecrecover takes the signature parameters, and the only way to get them
    // currently is to use assembly.
    // solium-disable-next-line security/no-inline-assembly
    assembly {
      r := mload(add(signature, 0x20))
      s := mload(add(signature, 0x40))
      v := byte(0, mload(add(signature, 0x60)))
    }

    // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
    if (v < 27) {
      v += 27;
    }

    // If the version is correct return the signer address
    if (v != 27 && v != 28) {
      return (address(0));
    } else {
      // solium-disable-next-line arg-overflow
      return ecrecover(hash, v, r, s);
    }
  }

  /**
   * toEthSignedMessageHash
   * @dev prefix a bytes32 value with "\x19Ethereum Signed Message:"
   * and hash the result
   */
  function toEthSignedMessageHash(bytes32 hash)
    internal
    pure
    returns (bytes32)
  {
    // 32 is the length in bytes of hash,
    // enforced by the type signature above
    return keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
    );
  }
}

// File: contracts/CryptoUtils.sol

/// @title Cryptographic utilities.
library CryptoUtils {
    uint8 public constant UNCOMPRESSED_PUBLIC_KEY_SIZE = 64;

    /// @dev Verifies ECDSA signature of a given message hash.
    /// @param _hash bytes32 The hash which is the signed message.
    /// @param _signature bytes The signature to verify.
    /// @param _address The public address of the signer (allegedly).
    function isSignatureValid(bytes32 _hash, bytes _signature, address _address) public pure returns (bool) {
        if (_address == address(0)) {
            return false;
        }

        address recovered = ECDSA.recover(_hash, _signature);
        return recovered != address(0) && recovered == _address;
    }

    /// @dev Converts a public key to an address.
    /// @param _publicKey bytes32 The uncompressed public key.
    function toAddress(bytes _publicKey) public pure returns (address) {
        if (_publicKey.length != UNCOMPRESSED_PUBLIC_KEY_SIZE) {
            return address(0);
        }

        return address(keccak256(_publicKey));
    }

    /// @dev Verifies the Merkle proof for the existence of a specific data. Please not that that this implementation
    /// assumes that each pair of leaves and each pair of pre-images are sorted (see tests for examples of
    /// construction).
    /// @param _proof bytes32[] The Merkle proof containing sibling SHA256 hashes on the branch from the leaf to the
    /// root.
    /// @param _root bytes32 The Merkle root.
    /// @param _leaf bytes The data to check.
    function isMerkleProofValid(bytes32[] _proof, bytes32 _root, bytes _leaf) public pure returns (bool) {
        return isMerkleProofValid(_proof, _root, sha256(_leaf));
    }

    /// @dev Verifies the Merkle proof for the existence of a specific data. Please not that that this implementation
    /// assumes that each pair of leaves and each pair of pre-images are sorted (see tests for examples of
    /// construction).
    /// @param _proof bytes32[] The Merkle proof containing sibling SHA256 hashes on the branch from the leaf to the
    /// root.
    /// @param _root bytes32 The Merkle root.
    /// @param _leafHash bytes32 The hash of the data to check.
    function isMerkleProofValid(bytes32[] _proof, bytes32 _root, bytes32 _leafHash) public pure returns (bool) {
        bytes32 computedHash = _leafHash;

        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];

            if (computedHash < proofElement) {
                // Hash the current computed hash with the current element of the proof.
                computedHash = sha256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash the current element of the proof with the current computed hash.
                computedHash = sha256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // Check if the computed hash (root) is equal to the provided root.
        return computedHash == _root;
    }
}

// File: contracts/AutonomousSwapProofVerifier.sol










/// @title ASB proof verification library
contract AutonomousSwapProofVerifier is IAutonomousSwapProofVerifier {
    using SafeMath for uint8;
    using SafeMath for uint256;
    using BytesLib for bytes;
    using BytesLibEx for bytes;

    // The version of the current proof verifier library.
    uint public constant VERSION = 1;

    // The supported Orbs protocol version.
    uint public constant ORBS_PROTOCOL_VERSION = 2;

    // Data sizes (in bytes).
    uint public constant UINT32_SIZE = 4;
    uint public constant UINT64_SIZE = 8;
    uint public constant UINT256_SIZE = 32;
    uint public constant ADDRESS_SIZE = 20;
    uint public constant SHA256_SIZE = UINT256_SIZE;
    uint public constant SIGNATURE_SIZE = 65;

    // Orbs specific data sizes (in bytes).
    uint public constant ORBS_ADDRESS_SIZE = 20;
    uint public constant ONEOF_NESTING_SIZE = 12;
    uint public constant BLOCKREFMESSAGE_SIZE = 52;
    uint public constant BLOCKHASH_OFFSET = 20;
    uint public constant NODE_PK_SIG_NESTING_SIZE = 4;
    uint public constant EXECUTION_RESULT_OFFSET = 36;

    // Orbs protocol values:
    uint public constant TRANSFERRED_OUT = 1;
    uint public constant EXECUTION_RESULT_SUCCESS = 1;

    // The maximum supported number of signatures in Results Block Proof. We have to limit this number and fallback to
    // statically sized lists, due to Solidity's inability of functions returning dynamic arrays (and limiting gas
    // consumption, of course).
    uint public constant MAX_SIGNATURES = 100;

    struct ResultsBlockHeader {
        uint32 protocolVersion;
        uint64 virtualChainId;
        uint32 networkType;
        uint64 timestamp;
        bytes32 transactionReceiptMerkleRoot;
    }

    struct ResultsBlockProof {
        uint32 blockProofVersion;
        bytes32 transactionsBlockHash;
        bytes32 blockrefHash;
        bytes32 blockHash;
        uint8 numOfSignatures;
        address[MAX_SIGNATURES] publicAddresses;
        bytes[MAX_SIGNATURES] signatures;
    }

    struct TransactionReceipt {
        uint32 executionResult;
        bytes eventData;
    }

    struct EventData {
        string orbsContractName;
        uint32 eventId;
        uint64 tuid;
        bytes20 from;
        address to;
        uint256 value;
    }

    // The federation smart contract.
    IFederation public federation;

    /// @dev Constructor that initializes the ASB Proof Verifier contract.
    /// @param _federation IFederation The federation smart contract.
    constructor(IFederation _federation) public {
        require(address(_federation) != address(0), "Federation must not be 0!");

        federation = _federation;
    }

    /// @dev Parses and validates the raw transfer proof. Please note that this method can't be external (yet), since
    /// our current Solidity version doesn't support unbound parameters (e.g., bytes) in external interface methods.
    /// @param _resultsBlockHeader bytes The raw Results Block Header.
    /// @param _resultsBlockProof bytes The raw Results Block Proof.
    /// @param _transactionReceipt bytes The raw Transaction Receipt.
    /// @return transferInEvent TransferInEvent The TransferIn event data.
    function processProof(bytes _resultsBlockHeader, bytes _resultsBlockProof, bytes _transactionReceipt,
        bytes32[] _transactionReceiptProof) public view returns(TransferInEvent memory transferInEvent) {

        // Parse Results Block Header:
        ResultsBlockHeader memory header = parseResultsBlockHeader(_resultsBlockHeader);

        // Verify that the Orbs protocol is supported.
        require(header.protocolVersion == ORBS_PROTOCOL_VERSION, "Unsupported protocol version!");

        // Verify that Result Block Proof by matching hashes and making sure that enough federation members have signed
        // it.
        verifyResultBlockProof(_resultsBlockHeader, _resultsBlockProof);

        // Verify the existence of the Transaction Receipt.
        require(CryptoUtils.isMerkleProofValid(_transactionReceiptProof, header.transactionReceiptMerkleRoot,
            _transactionReceipt), "Invalid transaction receipt proof!");

        // Parse the Transaction Receipt.
        TransactionReceipt memory transactionReceipt = parseTransactionReceipt(_transactionReceipt);

        // Verify transaction's execution result.
        require(transactionReceipt.executionResult == EXECUTION_RESULT_SUCCESS, "Invalid execution result!");

        // Extract the Autonomous Swap Event Data from the transaction receipt:
        EventData memory eventData = parseEventData(transactionReceipt.eventData);

        // Verify that the event is a TRANSFERRED_OUT event:
        require(eventData.eventId == TRANSFERRED_OUT, "Invalid event ID!");

        // Assign the rest of the fields.
        transferInEvent.networkType = header.networkType;
        transferInEvent.virtualChainId = header.virtualChainId;
        transferInEvent.orbsContractName = eventData.orbsContractName;
        transferInEvent.from = eventData.from;
        transferInEvent.to = eventData.to;
        transferInEvent.value = eventData.value;
        transferInEvent.tuid = eventData.tuid;
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

    /// Parses Results Block Header according to:
    /// +---------------------+--------+------+----------------------+
    /// |        Field        | Offset | Size |       Encoding       |
    /// +---------------------+--------+------+----------------------+
    /// | protocol_version    |      0 |    4 | uint32               |
    /// | virtual_chain_id    |      4 |    8 | uint64               |
    /// | network_type        |     12 |    4 | enum (4 bytes)       |
    /// | timestamp           |     16 |    8 | uint64 unix 64b time |
    /// | receipt_merkle_root |     64 |   32 | bytes (32B)          |
    /// +---------------------+--------+------+----------------------+
    /// @param _resultsBlockHeader bytes The raw Results Block Header data.
    /// @return res ResultsBlockHeader The parsed Results Block Header.
    function parseResultsBlockHeader(bytes _resultsBlockHeader) internal pure returns (ResultsBlockHeader memory res) {
        uint offset = 0;

        res.protocolVersion = _resultsBlockHeader.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        res.virtualChainId = _resultsBlockHeader.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        res.networkType = _resultsBlockHeader.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        res.timestamp = _resultsBlockHeader.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        offset = offset.add(40); // Jump to receipt_merkle_root.

        res.transactionReceiptMerkleRoot = _resultsBlockHeader.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);
    }

    /// @dev Parses Results Block Proof according to:
    /// +--------------------------------+------------+-----------+-------------+--------------------------+
    /// |             Field              |   Offset   |   Size    |  Encoding   |          Notes           |
    /// +--------------------------------+------------+-----------+-------------+--------------------------+
    /// | block_proof_version            | 0          | 4         | uint32      |                          |
    /// | transactions_block_hash length | 4          | always 4  | reserved    |                          |
    /// | transactions_block_hash        | 8          | 32        | bytes (32B) |                          |
    /// | oneof + nesting                | 40         | 12        | reserved    | oneof + proof + blockref |
    /// | blockref_message               | 52         | 52        | bytes (52B) |                          |
    /// | block_hash                     | 72         | 32        | bytes (32B) |                          |
    /// | node_pk_sig nesting            | 104 + 100n | reserved  |             |                          |
    /// | node_pk_length                 | 108 + 100n | 4         | always 20   | reserved                 |
    /// | node_pk                        | 112 + 100n | 20        | bytes (20B) | Ethereum address         |
    /// | node_sig_length                | 132 + 100n | 4         | always 65   | reserved                 |
    /// | node_sig                       | 136 + 100n | 65        | bytes (65B) |                          |
    /// +--------------------------------+------------+-----------+-------------+--------------------------+
    /// @param _resultsBlockProof bytes The raw Results Block Proof data.
    /// @return res ResultsBlockProof The parsed Results Block Proof.
    function parseResultsBlockProof(bytes _resultsBlockProof) internal pure returns (ResultsBlockProof memory res) {
        uint offset = 0;

        res.blockProofVersion = _resultsBlockProof.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        uint32 transactionsBlockHashSize =_resultsBlockProof.toUint32BE(offset);
        require(transactionsBlockHashSize == SHA256_SIZE, "Invalid hash size!");
        offset = offset.add(UINT32_SIZE);
        res.transactionsBlockHash = _resultsBlockProof.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);

        offset = offset.add(ONEOF_NESTING_SIZE); // oneof + nesting
        res.blockrefHash = sha256(_resultsBlockProof.slice(offset, BLOCKREFMESSAGE_SIZE));
        offset = offset.add(BLOCKHASH_OFFSET);

        res.blockHash = _resultsBlockProof.toBytes32(offset);
        offset = offset.add(SHA256_SIZE);

        // Note: in the case that the remaining buffer is too small - we will either revert in SafeMath or in
        // BytesUtils/Ex.
        while (offset < _resultsBlockProof.length) {
            offset = offset.add(NODE_PK_SIG_NESTING_SIZE); // node_pk_sig nesting

            uint32 publicAddressSize =_resultsBlockProof.toUint32BE(offset);
            require(publicAddressSize == ADDRESS_SIZE, "Invalid address size!");
            offset = offset.add(UINT32_SIZE);
            res.publicAddresses[res.numOfSignatures] = _resultsBlockProof.toAddress(offset);
            offset = offset.add(ADDRESS_SIZE);

            uint32 signatureSize =_resultsBlockProof.toUint32BE(offset);
            require(signatureSize == SIGNATURE_SIZE, "Invalid signature size!");
            offset = offset.add(UINT32_SIZE);
            res.signatures[res.numOfSignatures] = _resultsBlockProof.slice(offset, SIGNATURE_SIZE);
            offset = offset.add(SIGNATURE_SIZE);

            res.numOfSignatures = uint8(res.numOfSignatures.add(1));
        }
    }

    /// @dev Parses the Transaction Receipt according to:
    /// Builds the TransactionReceipt according to:
    /// +------------------+--------+----------+----------+-----------------------+
    /// |      Field       | Offset |   Size   | Encoding |         Notes         |
    /// +------------------+--------+----------+----------+-----------------------+
    /// | execution_result |     36 | 4        | enum     | 0x1 indicates success |
    /// | event length     |     40 | 4        | uint32   |                       |
    /// | event data       |     44 | variable | bytes    |                       |
    /// +------------------+--------+----------+----------+-----------------------+
    /// @param _transactionReceipt bytes The raw Transaction Receipt data.
    /// @return res TransactionReceipt The parsed Transaction Receipt.
    function parseTransactionReceipt(bytes _transactionReceipt) internal pure returns(TransactionReceipt memory res) {
        uint offset = 0;

        offset = offset.add(EXECUTION_RESULT_OFFSET);

        res.executionResult = _transactionReceipt.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        uint32 eventDataLength =_transactionReceipt.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);
        res.eventData = _transactionReceipt.slice(offset, eventDataLength);
        offset = offset.add(eventDataLength);
    }

    /// @dev Parses Autonomous Swap Event Data according to:
    /// +--------------------------+--------+------+-------------+-------------------------------+
    /// |          Field           | Offset | Size |  Encoding   |             Notes             |
    /// +--------------------------+--------+------+-------------+-------------------------------+
    /// | contract name length (N) | 0      | 4    | uint32      |                               |
    /// | contract name            | 4      | N    | string      |                               |
    /// | event_id                 | 4+N    | 4    | enum        | 0x1 indicates TRANSFERRED_OUT |
    /// | tuid                     | 8+N    | 8    | uint64      |                               |
    /// | ethereum_address length  | N+16   | 4    | always 20   | reserved                      |
    /// | ethereum_address         | N+20   | 20   | bytes (20B) |                               |
    /// | orbs_address length      | N+40   | 4    | always 20   | reserved                      |
    /// | orbs_address             | N+44   | 20   | bytes (20B) |                               |
    /// | tokens length            | N+64   | 4    | always 32   | reserved                      |
    /// | tokens                   | N+68   | 32   | uint256     |                               |
    /// +--------------------------+--------+------+-------------+-------------------------------+
    /// @param _eventData bytes The raw event data.
    /// @return res EventData The parsed Autonomous Swap Event Data.
    function parseEventData(bytes _eventData) internal pure returns (EventData memory res) {
        uint offset = 0;

        uint32 orbsContractNameLength = _eventData.toUint32BE(0);
        offset = offset.add(UINT32_SIZE);
        res.orbsContractName = string(_eventData.slice(offset, orbsContractNameLength));
        offset = offset.add(orbsContractNameLength);

        res.eventId = _eventData.toUint32BE(offset);
        offset = offset.add(UINT32_SIZE);

        res.tuid = _eventData.toUint64BE(offset);
        offset = offset.add(UINT64_SIZE);

        uint32 fromAddressSize =_eventData.toUint32BE(offset);
        require(fromAddressSize == ORBS_ADDRESS_SIZE, "Invalid Orbs address size!");
        offset = offset.add(UINT32_SIZE);
        res.from = _eventData.toBytes20(offset);
        offset = offset.add(ORBS_ADDRESS_SIZE);

        uint32 toAddressSize =_eventData.toUint32BE(offset);
        require(toAddressSize == ADDRESS_SIZE, "Invalid Ethereum address size!");
        offset = offset.add(UINT32_SIZE);
        res.to = _eventData.toAddress(offset);
        offset = offset.add(ADDRESS_SIZE);

        uint32 valueSize =_eventData.toUint32BE(offset);
        require(valueSize == UINT256_SIZE, "Invalid value size!");
        offset = offset.add(UINT32_SIZE);
        res.value = _eventData.toUintBE(offset);
        offset = offset.add(UINT256_SIZE);
    }

    /// @dev Verifies federation members signatures on the blockref message.
    /// @param proof ResultsBlockProof The proof data.
    function isSignatureValid(ResultsBlockProof memory proof) internal view returns (bool) {
        uint requiredThreshold = federation.getConsensusThresholdByRevision(proof.blockProofVersion);
        uint currentThreshold = 0;

        // Since Solidity doesn't support dynamic arrays in memory, we will use a fixed sizes addresses array for
        // looking for duplicates: a[i] == address(0) would mean that signature[i] is duplicated.
        address[] memory duplicatesLookup = new address[](proof.numOfSignatures);

        for (uint i = 0; i < proof.numOfSignatures; ++i) {
            address signer = proof.publicAddresses[i];
            bytes memory signature = proof.signatures[i];

            // Check if the signer is a member of the federation, at the time of the creation of the proof.
            if (!federation.isMemberByRevision(proof.blockProofVersion, signer)) {
                continue;
            }

            // Verify that the signature is correct.
            if (!CryptoUtils.isSignatureValid(proof.blockrefHash, signature, signer)) {
                continue;
            }

            // Verify that the signature isn't duplicated.
            bool unique = true;
            for (uint j = 0; j < i; ++j) {
                if (signer == duplicatesLookup[j]) {
                    unique = false;
                    break;
                }
            }

            if (!unique) {
                continue;
            }

            duplicatesLookup[i] = signer;

            // If we've reached so far, then this is a valid signature indeed and should be take into the account. If
            // we have collected enough signatures - we can stop and return true.
            currentThreshold = currentThreshold.add(1);
            if (currentThreshold >= requiredThreshold) {
                return true;
            }
        }

        return false;
    }

    function verifyResultBlockProof(bytes _resultsBlockHeader, bytes _resultsBlockProof) private view {
        ResultsBlockProof memory proof = parseResultsBlockProof(_resultsBlockProof);

        // Verify the block hash.
        bytes32 resultsBlockHeaderHash = sha256(_resultsBlockHeader);
        bytes32 calculatedBlockHash = sha256(abi.encodePacked(proof.transactionsBlockHash, resultsBlockHeaderHash));
        require(calculatedBlockHash == proof.blockHash, "Block hash doesn't match!");

        // Verify federation members signatures on the blockref message.
        require(isSignatureValid(proof), "Invalid signature!");
    }
}

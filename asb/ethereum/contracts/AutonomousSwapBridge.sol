pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./IFederation.sol";
import "./IAutonomousSwapProofVerifier.sol";
import "./StringUtils.sol";


/// @title Autonomous Swap Bridge (ASB) smart contract.
contract AutonomousSwapBridge is Ownable {
    using SafeMath for uint256;
    using StringUtils for string;

    // The version of the current ASB smart contract.
    uint public constant VERSION = 1;

    // The network type of the Orbs network this contract is compatible for.
    uint32 public networkType;

    // The virtual chain ID of the underlying token on the Orbs network.
    uint64 public virtualChainId;

    // The name of the Orbs Autonomous Swap Bridge (ASB) smart contract (used during proof verification).
    string public orbsASBContractName;

    // The swappable ERC20 token.
    IERC20 public token;

    // The federation smart contract.
    IFederation public federation;

    // The ASB proof verifier.
    IAutonomousSwapProofVerifier public verifier;

    // Incremental counter for Transaction Unique Identifiers (TUID).
    uint256 public tuidCounter = 0;

    // Max received Orbs TUID. 
    uint256 public maxOrbsTuid;

    // Mapping of spent Orbs TUIDs.
    mapping(uint256 => bool) public spentOrbsTuids;

    event EthTransferredOut(uint256 indexed tuid, address indexed from, bytes20 indexed to, uint256 value);
    event EthTransferredIn(uint256 indexed tuid, bytes20 indexed from, address indexed to, uint256 value);

    /// @dev Constructor that initializes the ASB contract.
    /// @param _networkType uint32 The network type of the Orbs network this contract is compatible for.
    /// @param _virtualChainId uint64 The virtual chain ID of the underlying token on the Orbs network.
    /// @param _orbsASBContractName string The address of the Federation contract.
    /// @param _token IERC20 The swappable ERC20 token.
    /// @param _federation IFederation The federation smart contract.
    /// @param _verifier IAutonomousSwapProofVerifier The ASB proof verifier.
    constructor(uint32 _networkType, uint64 _virtualChainId, string _orbsASBContractName, IERC20 _token,
        IFederation _federation, IAutonomousSwapProofVerifier _verifier) public {
        require(address(_federation) != address(0), "Federation must not be 0!");

        federation = _federation;
        setAutonomousSwapProofVerifier(_verifier);
        initAutonomousSwapBridge(_networkType, _virtualChainId, _orbsASBContractName, _token);
    }

    /// @dev Transfer tokens to Orbs. The method retrieves and locks the tokens and emits the EthTransferredOut event.
    /// @param _to bytes20 The Orbs address to transfer to.
    /// @param _value uint256 The amount to be transferred.
    function transferOut(bytes20 _to, uint256 _value) public {
        require(verifier.isOrbsAddressValid(_to), "Orbs address is invalid!");
        require(_value > 0, "Value must be greater than 0!");

        // Verify that the requested approved enough tokens to transfer out.
        require(token.transferFrom(msg.sender, address(this), _value), "Insufficient allowance!");

        // Get a fresh TUID. Please note that a uint256 overflow isn't a concern here, since it can only happen after
        // 2^256 transactions (in which case, it will be no longer possible to issue transfers using this specific
        // instance of the ASB smart contract).
        tuidCounter = tuidCounter.add(1);

        emit EthTransferredOut(tuidCounter, msg.sender, _to, _value);
    }

    /// @dev Transfer tokens from Orbs.
    /// @param _packedProof bytes The raw proof (including the resultsBlockHeader, resultsBlockProof and 
    /// @param _transactionReceipt bytes The raw Transaction Receipt.
    function transferIn(bytes _packedProof, bytes _transactionReceipt) public {
        IAutonomousSwapProofVerifier.TransferInEvent memory eventData = verifier.processPackedProof(_packedProof, _transactionReceipt);

        require(eventData.to != address(0), "Destination address can't be 0!");
        require(eventData.value > 0, "Value must be greater than 0!");

        // Verify network and protocol parameters.
        require(networkType == eventData.networkType, "Incorrect network type!");
        require(virtualChainId == eventData.virtualChainId, "Incorrect virtual chain ID!");
        require(orbsASBContractName.equal(eventData.orbsContractName), "Incorrect Orbs ASB contract name!");

        // Make sure that the transaction wasn't already spent and mark it as such;
        require(!spentOrbsTuids[eventData.tuid], "TUID was already spent!");
        spentOrbsTuids[eventData.tuid] = true;
        if (eventData.tuid > maxOrbsTuid) {
            maxOrbsTuid = eventData.tuid;
        }

        // Transfer the token.
        require(token.transfer(eventData.to, eventData.value), "Insufficient funds!");

        emit EthTransferredIn(eventData.tuid, eventData.from, eventData.to, eventData.value);
    }

    /// @dev Allows the owner to upgrade its ASB proof verifier.
    /// @param _verifier IAutonomousSwapProofVerifier new verifier.
    function setAutonomousSwapProofVerifier(IAutonomousSwapProofVerifier _verifier) public onlyOwner {
        require(address(_verifier) != address(0), "Verifier must not be 0!");

        verifier = _verifier;
    }

    /// @dev initAutonomousSwapBridge resets the Autonomous Swap Bridge and resets its state.
    /// initAutonomousSwapBridge does not modify teh infrustructrue settings - the federation contract  
    /// address and the IAutonomousSwapProofVerifier contract address.
    /// initAutonomousSwapBridge is called by the constructor upon deploy.
    /// @param _networkType uint32 The network type of the Orbs network this contract is compatible for.
    /// @param _virtualChainId uint64 The virtual chain ID of the underlying token on the Orbs network.
    /// @param _orbsASBContractName string The address of the Federation contract.
    /// @param _token IERC20 The swappable ERC20 token.
    function initAutonomousSwapBridge(uint32 _networkType, uint64 _virtualChainId, string _orbsASBContractName, 
        IERC20 _token) public {
        require(bytes(_orbsASBContractName).length > 0, "Orbs ASB contract name must not be empty!");
        require(address(_token) != address(0), "Token must not be 0!");

        networkType = _networkType;
        virtualChainId = _virtualChainId;
        orbsASBContractName = _orbsASBContractName;
        token = _token;
        tuidCounter = 0;
        
        // TODO address gas limit by allowing reset by multiple transactions.
        for (uint i = 0; i <= maxOrbsTuid; ++i) { 
            delete(spentOrbsTuids[i]);
        }
        maxOrbsTuid = 0;
    }
}

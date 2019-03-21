pragma solidity 0.5.3;


import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IOrbsNetworkTopology.sol";
import "./IOrbsValidators.sol";
import "./OrbsValidatorsRegistry.sol";


contract OrbsValidators is Ownable, IOrbsValidators, IOrbsNetworkTopology {

    // The version of the current Validators smart contract.
    uint public constant VERSION = 1;

    // Maximum number of validators.
    uint internal constant MAX_VALIDATOR_LIMIT = 100;
    uint public validatorsLimit;

    // The validators metadata registration database smart contract
    IOrbsValidatorsRegistry public orbsValidatorsRegistry;

    //Array of approved validators addresses
    address[] internal approvedValidators;

    //Mapping of address and in which block it was approved.
    mapping(address => uint) internal approvalBlockNumber;

    /// @dev Constructor that initializes the validators smart contract with the validators metadata registration
    ///     database smart contract.
    /// @param registry_ IOrbsValidatorsRegistry The address of the validators metadata registration database.
    /// @param validatorsLimit_ uint Maximum number of validators list maximum size.
    constructor(IOrbsValidatorsRegistry registry_, uint validatorsLimit_) public {
        require(registry_ != IOrbsValidatorsRegistry(0), "Registry contract address 0");
        require(validatorsLimit_ > 0, "Limit must be positive");
        require(validatorsLimit_ <= MAX_VALIDATOR_LIMIT, "Limit is too high");

        validatorsLimit = validatorsLimit_;
        orbsValidatorsRegistry = registry_;
    }

    /// @dev Adds a validator to participate in network
    /// @param validator address The address of the validators.
    function approve(address validator) public onlyOwner {
        require(validator != address(0), "Address must not be 0!");
        require(approvedValidators.length < MAX_VALIDATOR_LIMIT, "Can't add more members!");
        require(approvedValidators.length < validatorsLimit, "Can't add more members!");
        require(!isApproved(validator), "Address must not be already approved");

        approvedValidators.push(validator);
        approvalBlockNumber[validator] = block.number;
        emit ValidatorApproved(validator);
    }

    /// @dev Remove a validator from the List based on Guardians votes.
    /// @param validator address The address of the validators.
    function remove(address validator) public onlyOwner {
        require(isApproved(validator), "Not an approved validator");

        uint approvedLength = approvedValidators.length;
        for (uint i = 0; i < approvedLength; ++i) {
            if (approvedValidators[i] == validator) {

                // replace with last element and remove from end
                approvedValidators[i] = approvedValidators[approvedLength - 1];
                approvedValidators.length--;

                // clear approval block height
                delete approvalBlockNumber[validator];

                emit ValidatorRemoved(validator);
                return;
            }
        }
    }

    /// @dev returns if an address belongs to the approved list & exists in the validators metadata registration database.
    /// @param validator address The address of the validators.
    function isValidator(address validator) public view returns (bool) {
        return isApproved(validator) && orbsValidatorsRegistry.isValidator(validator);
    }

    /// @dev returns if an address belongs to the approved list
    /// @param validator address The address of the validators.
    function isApproved(address validator) public view returns (bool) {
        return approvalBlockNumber[validator] > 0;
    }

    /// @dev returns a list of all validators that have been approved and exist in the validator registration database.
    function getValidators() public view returns (address[] memory) {
        uint approvedLength = approvedValidators.length;
        address[] memory validators = new address[](approvedLength);

        uint pushAt = 0;
        for (uint i = 0; i < approvedLength; i++) {
            if (orbsValidatorsRegistry.isValidator(approvedValidators[i])) {
                validators[pushAt] = approvedValidators[i];
                pushAt++;
            }
        }

        return sliceArray(validators,pushAt);
    }

    /// @dev returns a list of all validators that have been approved and exist in the validator registration
    ///      database like getValidators but returns byte20 which is more compatible in some cases.
    function getValidatorsBytes20() public view returns (bytes20[] memory) {
        address[] memory validatorAddresses = getValidators();
        uint validatorAddressesLength = validatorAddresses.length;

        bytes20[] memory result = new bytes20[](validatorAddressesLength);

        for (uint i = 0; i < validatorAddressesLength; i++) {
            result[i] = bytes20(validatorAddresses[i]);
        }

        return result;
    }

    /// @dev returns the block number in which the validator was approved.
    /// @param validator address The address of the validators.
    function getApprovalBlockNumber(address validator)
        external
        view
        returns (uint)
    {
        return approvalBlockNumber[validator];
    }

    /// @dev returns an array of pairs with node addresses and ip addresses.
    function getNetworkTopology()
        public
        view
        returns (bytes20[] memory nodeAddresses, bytes4[] memory ipAddresses)
    {
        address[] memory validators = getValidators(); // filter unregistered
        uint validatorsLength = validators.length;
        nodeAddresses = new bytes20[](validatorsLength);
        ipAddresses = new bytes4[](validatorsLength);

        for (uint i = 0; i < validatorsLength; i++) {
            bytes4 ip;
            bytes20 orbsAddr;
            ( , ip , , orbsAddr) = orbsValidatorsRegistry.getValidatorData(validators[i]);
            nodeAddresses[i] = orbsAddr;
            ipAddresses[i] = ip;
        }
    }

    /// @dev internal method that returns a slice of an array.
    function sliceArray(address[] memory arr, uint len)
        internal
        pure
        returns (address[] memory)
    {
        require (len <= arr.length, "sub array must be longer then array");

        address[] memory result = new address[](len);
        for(uint i=0; i<len; i++){
            result[i] = arr[i];
        }
        return result;
    }
}
pragma solidity 0.5.3;


import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IOrbsNetworkTopology.sol";
import "./IOrbsValidators.sol";
import "./OrbsValidatorsRegistry.sol";


contract OrbsValidators is Ownable, IOrbsValidators, IOrbsNetworkTopology {

    // The version of the current Validators smart contract.
    uint public constant VERSION = 1;

    // Maximum number of the federation members.
    uint internal constant MAX_VALIDATOR_LIMIT = 100;
    uint public validatorsLimit;

    IOrbsValidatorsRegistry public orbsValidatorsRegistry;

    address[] internal approvedValidators;
    mapping(address => uint) internal approvalBlockNumber;

    constructor(IOrbsValidatorsRegistry registry_, uint validatorsLimit_) public {
        require(registry_ != IOrbsValidatorsRegistry(0), "Registry contract address 0");
        require(validatorsLimit_ > 0, "Limit must be positive");
        require(validatorsLimit_ <= MAX_VALIDATOR_LIMIT, "Limit is too high");

        validatorsLimit = validatorsLimit_;
        orbsValidatorsRegistry = registry_;
    }

    function approve(address validator) public onlyOwner {
        require(validator != address(0), "Address must not be 0!");
        require(approvedValidators.length < MAX_VALIDATOR_LIMIT, "Can't add more members!");
        require(approvedValidators.length < validatorsLimit, "Can't add more members!");
        require(!isApproved(validator), "Address must not be already approved");

        approvedValidators.push(validator);
        approvalBlockNumber[validator] = block.number;
        emit ValidatorApproved(validator);
    }

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

    function isValidator(address validator) public view returns (bool) {
        return isApproved(validator) && orbsValidatorsRegistry.isValidator(validator);
    }

    function isApproved(address validator) public view returns (bool) {
        return approvalBlockNumber[validator] > 0;
    }

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

    function getValidatorsBytes20() public view returns (bytes20[] memory) {
        address[] memory validatorAddresses = getValidators();
        uint validatorAddressesLength = validatorAddresses.length;

        bytes20[] memory result = new bytes20[](validatorAddressesLength);

        for (uint i = 0; i < validatorAddressesLength; i++) {
            result[i] = bytes20(validatorAddresses[i]);
        }

        return result;
    }

    function getApprovalBlockNumber(address validator)
        external
        view
        returns (uint)
    {
        return approvalBlockNumber[validator];
    }

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
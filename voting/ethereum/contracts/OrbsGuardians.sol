pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./IOrbsGuardians.sol";

contract OrbsGuardians is IOrbsGuardians {
    using SafeMath for uint256;

    struct GuardianData {
        string name;
        string website;
        uint index;
        uint registeredOnBlock;
        uint lastUpdatedOnBlock;
    }

    // The version of the current Guardian smart contract.
    uint public constant VERSION = 1;

    //Amount of Ether need to be locked when registering - this will be set to 1.
    uint public registrationDeposit;

    //Iterable array to get a list of all guardians
    address[] internal guardians;

    //Mapping between address and the guardian data.
    mapping(address => GuardianData) internal guardiansData;

    /// @dev Constructor that initializes the amount of ether needed to lock when registering. This will be set to 1.
    /// @param registrationDeposit_ uint the amount of ether needed to lock when registering.
    constructor(uint registrationDeposit_) public {
        registrationDeposit = registrationDeposit_;
    }

    /// @dev register a new guardian. You will need to transfer registrationDeposit amount of ether.
    /// @param name string The name of the guardian
    /// @param website string The website of the guardian
    function register(string memory name, string memory website)
        public
        payable
    {
        require(tx.origin == msg.sender, "Only EOA may register as Guardian");
        require(bytes(name).length > 0, "Please provide a valid name");
        require(bytes(website).length > 0, "Please provide a valid website");
        require(!isGuardian(msg.sender), "Cannot be a guardian");
        require(msg.value == registrationDeposit, "Please provide the exact registration deposit");

        uint index = guardians.length;
        guardians.push(msg.sender);
        guardiansData[msg.sender] = GuardianData(name, website, index , block.number, block.number);

        emit GuardianRegistered(msg.sender);
    }


    /// @dev update guardian details. only msg.sender can update it's own guardian details.
    /// @param name string The name of the guardian
    /// @param website string The website of the guardian
    function update(string memory name, string memory website)
        public
    {
        require(tx.origin == msg.sender, "Only EOA may register as Guardian");
        require(bytes(name).length > 0, "Please provide a valid name");
        require(bytes(website).length > 0, "Please provide a valid website");
        require(isGuardian(msg.sender), "You must be a registered guardian");

        guardiansData[msg.sender].name = name;
        guardiansData[msg.sender].website = website;
        guardiansData[msg.sender].lastUpdatedOnBlock = block.number;

        emit GuardianUpdated(msg.sender);
    }


    /// @dev delete the guardian and take back the locked ether. only msg.sender can leave.
    function leave() public {
        require(tx.origin == msg.sender, "Only EOA may register as Guardian");
        require(isGuardian(msg.sender), "Sender is not a Guardian");

        uint i = guardiansData[msg.sender].index;

        assert(guardians[i] == msg.sender); // will consume all available gas.

        // replace with last element and remove from end
        guardians[i] = guardians[guardians.length - 1]; // switch with last
        guardiansData[guardians[i]].index = i; // update it's lookup index
        guardians.length--; // remove the last one

        // clear data
        delete guardiansData[msg.sender];

        // refund deposit
        msg.sender.transfer(registrationDeposit);

        emit GuardianLeft(msg.sender);
    }

    /// @dev returns if the address belongs to a guardian
    /// @param guardian address the guardian address
    function isGuardian(address guardian) public view returns (bool) {
        return guardiansData[guardian].registeredOnBlock > 0;
    }

    /// @dev returns an array of guardians.
    /// @param offset uint offset from which to start getting guardians from the array
    /// @param limit uint limit of guardians to be returned.
    function getGuardians(uint offset, uint limit)
        public
        view
        returns (address[] memory)
    {
        if (offset >= guardians.length) { // offset out of bounds
            return new address[](0);
        }

        if (offset.add(limit) > guardians.length) { // clip limit to array size
            limit = guardians.length.sub(offset);
        }

        address[] memory result = new address[](limit);

        uint resultLength = result.length;
        for (uint i = 0; i < resultLength; i++) {
            result[i] = guardians[offset.add(i)];
        }

        return result;
    }

    /// @dev returns an array of guardians as Bytes20 - similar to getGuardians, but returns byte20 which is
    ///      more compatible in some cases.
    /// @param offset uint offset from which to start getting guardians from the array
    /// @param limit uint limit of guardians to be returned.
    function getGuardiansBytes20(uint offset, uint limit)
        public
        view
        returns (bytes20[] memory)
    {
        address[] memory guardianAddresses = getGuardians(offset, limit);
        uint guardianAddressesLength = guardianAddresses.length;

        bytes20[] memory result = new bytes20[](guardianAddressesLength);

        for (uint i = 0; i < guardianAddressesLength; i++) {
            result[i] = bytes20(guardianAddresses[i]);
        }

        return result;
    }

    /// @dev returns name and website for  a specific guardian.
    /// @param guardian address the guardian address
    function getGuardianData(address guardian)
        public
        view
        returns (string memory name, string memory website)
    {
        require(isGuardian(guardian), "Please provide a listed Guardian");
        return (guardiansData[guardian].name, guardiansData[guardian].website);
    }

    /// @dev Convenience method to check if you are a guardian.
    function reviewRegistration()
        public
        view
        returns (string memory name, string memory website)
    {
        return getGuardianData(msg.sender);
    }

    /// @dev returns in which block the guardian was register, and in which block it was last updated.
    /// @param guardian address the guardian address
    function getRegistrationBlockNumber(address guardian)
        public
        view
        returns (uint registeredOn, uint lastUpdatedOn)
    {
        require(isGuardian(guardian), "Please provide a listed Guardian");

        GuardianData storage entry = guardiansData[guardian];
        return (
            entry.registeredOnBlock,
            entry.lastUpdatedOnBlock
        );
    }
}

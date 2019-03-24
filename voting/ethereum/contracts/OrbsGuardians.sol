pragma solidity 0.4.25;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

import "./IOrbsGuardians.sol";

contract OrbsGuardians is IOrbsGuardians {
    using SafeMath for uint256;

    struct GuardianData {
        string name;
        string website;
        uint index;
        uint registeredOnBlock;
        uint lastUpdatedOnBlock;
        uint registeredOn;
    }

    // The version of the current Guardian smart contract.
    uint public constant VERSION = 1;

    // Amount of Ether in Wei need to be locked when registering - this will be set to 1.
    uint public registrationDepositWei;
    // The amount of time needed to wait until a guardian can leave and get registrationDepositWei_
    uint public registrationMinTime;

    // Iterable array to get a list of all guardians
    address[] internal guardians;

    // Mapping between address and the guardian data.
    mapping(address => GuardianData) internal guardiansData;

    /// @dev Constructor that initializes the amount of ether needed to lock when registering. This will be set to 1.
    /// @param registrationDepositWei_ uint the amount of ether needed to lock when registering.
    /// @param registrationMinTime_ uint the amount of time needed to wait until a guardian can leave and get registrationDepositWei_
    constructor(uint registrationDepositWei_, uint registrationMinTime_) public {
        require(registrationDepositWei_ > 0, "registrationDepositWei_ must be positive");

        registrationMinTime = registrationMinTime_;
        registrationDepositWei = registrationDepositWei_;
    }

    /// @dev register a new guardian. You will need to transfer registrationDepositWei amount of ether.
    /// @param name string The name of the guardian
    /// @param website string The website of the guardian
    function register(string name, string website)
        external
        payable
        onlyEOA
    {
        address sender = msg.sender;
        require(bytes(name).length > 0, "Please provide a valid name");
        require(bytes(website).length > 0, "Please provide a valid website");
        require(!isGuardian(sender), "Cannot be a guardian");
        require(msg.value == registrationDepositWei, "Please provide the exact registration deposit");

        uint index = guardians.length;
        guardians.push(sender);
        guardiansData[sender] = GuardianData({
            name: name,
            website: website,
            index: index ,
            registeredOnBlock: block.number,
            lastUpdatedOnBlock: block.number,
            registeredOn: block.timestamp
        });

        emit GuardianRegistered(sender);
    }

    /// @dev update guardian details. only msg.sender can update it's own guardian details.
    /// @param name string The name of the guardian
    /// @param website string The website of the guardian
    function update(string name, string website)
        external
        onlyGuardian
        onlyEOA
    {
        address sender = msg.sender;
        require(bytes(name).length > 0, "Please provide a valid name");
        require(bytes(website).length > 0, "Please provide a valid website");


        guardiansData[sender].name = name;
        guardiansData[sender].website = website;
        guardiansData[sender].lastUpdatedOnBlock = block.number;

        emit GuardianUpdated(sender);
    }

    /// @dev Delete the guardian and take back the locked ether. only msg.sender can leave.
    function leave() external onlyGuardian onlyEOA {
        address sender = msg.sender;
        require(block.timestamp >= guardiansData[sender].registeredOn.add(registrationMinTime), "Minimal guardian time didnt pass");

        uint i = guardiansData[sender].index;

        assert(guardians[i] == sender); // Will consume all available gas.

        // Replace with last element and remove from end
        guardians[i] = guardians[guardians.length - 1]; // Switch with last
        guardiansData[guardians[i]].index = i; // Update it's lookup index
        guardians.length--; // Remove the last one

        // Clear data
        delete guardiansData[sender];

        // Refund deposit
        sender.transfer(registrationDepositWei);

        emit GuardianLeft(sender);
    }

    /// @dev returns an array of guardians as Bytes20 - similar to getGuardians, but returns byte20 which is
    ///      more compatible in some cases.
    /// @param offset uint offset from which to start getting guardians from the array
    /// @param limit uint limit of guardians to be returned.
    function getGuardiansBytes20(uint offset, uint limit)
        external
        view
        returns (bytes20[])
    {
        address[] memory guardianAddresses = getGuardians(offset, limit);
        uint guardianAddressesLength = guardianAddresses.length;

        bytes20[] memory result = new bytes20[](guardianAddressesLength);

        for (uint i = 0; i < guardianAddressesLength; i++) {
            result[i] = bytes20(guardianAddresses[i]);
        }

        return result;
    }

    /// @dev Convenience method to check if you are a guardian.
    function reviewRegistration()
        external
        view
        returns (string name, string website)
    {
        return getGuardianData(msg.sender);
    }

    /// @dev Returns in which block the guardian was register, and in which block it was last updated.
    /// @param guardian address the guardian address
    function getRegistrationBlockNumber(address guardian)
        external
        view
        returns (uint registeredOn, uint lastUpdatedOn)
    {
        require(isGuardian(guardian), "Please provide a listed Guardian");

        GuardianData storage entry = guardiansData[guardian];
        registeredOn = entry.registeredOnBlock;
        lastUpdatedOn = entry.lastUpdatedOnBlock;
    }

    /// @dev Returns an array of guardians.
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

    /// @dev Returns name and website for  a specific guardian.
    /// @param guardian address the guardian address
    function getGuardianData(address guardian)
        public
        view
        returns (string memory name, string memory website)
    {
        require(isGuardian(guardian), "Please provide a listed Guardian");
        name = guardiansData[guardian].name;
        website = guardiansData[guardian].website;
    }

    /// @dev Returns if the address belongs to a guardian
    /// @param guardian address the guardian address
    function isGuardian(address guardian) public view returns (bool) {
        return guardiansData[guardian].registeredOnBlock > 0;
    }

    /// @dev Check that the caller is a guardian.
    modifier onlyGuardian() {
        require(isGuardian(msg.sender), "You must be a registered guardian");
        _;
    }

    /// @dev Check that the caller is not a contract.
    modifier onlyEOA() {
        require(!Address.isContract(msg.sender),"Only EOA may register as Guardian");
        _;
    }
}

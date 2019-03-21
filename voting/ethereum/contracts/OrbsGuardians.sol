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

    uint public registrationDeposit;

    address[] internal guardians;
    mapping(address => GuardianData) internal guardiansData;

    constructor(uint registrationDeposit_) public {
        registrationDeposit = registrationDeposit_;
    }

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

    function isGuardian(address guardian) public view returns (bool) {
        return guardiansData[guardian].registeredOnBlock > 0;
    }

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

    function getGuardianData(address guardian)
        public
        view
        returns (string memory name, string memory website)
    {
        require(isGuardian(guardian), "Please provide a listed Guardian");
        return (guardiansData[guardian].name, guardiansData[guardian].website);
    }

    function reviewRegistration()
        public
        view
        returns (string memory name, string memory website)
    {
        return getGuardianData(msg.sender);
    }

    function getRegistrationBlockNumber(address guardian)
        external
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

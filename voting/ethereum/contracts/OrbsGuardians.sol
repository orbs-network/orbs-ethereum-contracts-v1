pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./IOrbsGuardians.sol";

contract OrbsGuardians is IOrbsGuardians {
    using SafeMath for uint256;

    struct GuardianData {
        string name;
        string website;
        uint index;
    }

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    event GuardianAdded(address indexed validator);
    event GuardianLeft(address indexed validator);
    event GuardianModified(address indexed validator);

    address[] public guardians;
    mapping(address => GuardianData) public guardiansData;

    function register(string memory _name, string memory _website) public {
        require(bytes(_name).length > 0, "Please provide a valid name");
        require(bytes(_website).length > 0, "Please provide a valid website");

        bool adding = !isGuardian(msg.sender);
        uint index;
        if (adding) {
            index = guardians.length;
            guardians.push(msg.sender);
            emit GuardianAdded(msg.sender);
        } else {
            index = guardiansData[msg.sender].index;
            emit GuardianModified(msg.sender);
        }

        guardiansData[msg.sender] = GuardianData(_name, _website, index);
    }

    function leave() public {
        require(isGuardian(msg.sender), "Sender is not a Guardian");

        uint i = guardiansData[msg.sender].index;

        assert(guardians[i] == msg.sender);

        guardians[i] = guardians[guardians.length - 1]; // switch with last
        guardiansData[guardians[i]].index = i; // update it's lookup index

        delete guardiansData[msg.sender];
        guardians.length--;

        emit GuardianLeft(msg.sender);
        return;

    }

    function isGuardian(address _guardian) public view returns (bool) {
        return bytes(guardiansData[_guardian].name).length > 0;
    }

    function getGuardians(uint offset, uint limit)
        public
        view returns (address[] memory)
    {
        require(offset < guardians.length, "Offset too high");
        require(limit <= 100, "Page size may not exceed 100");

        if (offset.add(limit) > guardians.length) { // clip page to array size
            limit = guardians.length.sub(offset);
        }

        address[] memory result = new address[](limit);

        uint resultLength = result.length;
        for (uint i = 0; i < resultLength; i++) {
            result[i] = guardians[offset.add(i)];
        }

        return result;
    }

    function getGuardianData(address _guardian)
        public
        view
        returns (string memory name, string memory website)
    {
        require(isGuardian(_guardian), "Please provide a listed Guardian");
        return (guardiansData[_guardian].name, guardiansData[_guardian].website);
    }
}

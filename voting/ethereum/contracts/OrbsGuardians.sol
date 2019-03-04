pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

interface IOrbsGuardians {
    function register(string calldata _name, string calldata _website) external;
    function getGuardianData(address _validator) external view returns (string memory _name, string memory _website);
    function isGuardian(address _guardian) external view returns (bool);
    function getGuardians(uint offset, uint limit) external view returns (address[] memory);
    function leave() external;
}

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
    mapping (address => GuardianData) public guardiansData;

    function isGuardian(address _guardian) public view returns (bool) {
        return bytes(guardiansData[_guardian].name).length > 0;
    }

    function getGuardians(uint offset, uint limit) public view returns (address[] memory) {
        require(offset < guardians.length.sub(1), "Offset too high");
        require(limit <= 100, "Page size may not exceed 100");

        if (offset.add(limit) > guardians.length) { // clip page to array size
            limit = guardians.length.sub(offset);
        }

        address[] memory result = new address[](limit);

        for (uint i = 0; i < result.length; i++) {
            result[i] = guardians[offset.add(i)];
        }

        return result;
    }

    function leave() public {
        require(isGuardian(msg.sender), "Sender is not a Guardian");

        uint i = guardiansData[msg.sender].index;

        assert(guardians[i] == msg.sender); // if this is not the case we are in limbo

        guardians[i] = guardians[guardians.length - 1]; // move the last element to the evacuating index
        guardiansData[guardians[i]].index = i; // and adjust it's lookup index

        delete guardiansData[msg.sender];
        guardians.length--;

        emit GuardianLeft(msg.sender);
        return;

    }

    function register(string memory _name, string memory _website) public {
        require(bytes(_name).length > 0, "Please provide a valid name");
        require(bytes(_website).length > 0, "Please provide a valid website");

        bool adding = !isGuardian(msg.sender);

        if (adding) {
            guardiansData[msg.sender] = GuardianData(_name, _website, guardians.length);
            guardians.push(msg.sender);
            emit GuardianAdded(msg.sender);
        } else {
            guardiansData[msg.sender] = GuardianData(_name, _website, guardiansData[msg.sender].index);
            emit GuardianModified(msg.sender);
        }
    }

    function getGuardianData(address _guardian) public view returns (string memory _name, string memory _website) {
        require(isGuardian(_guardian), "Please provide a listed Guardian");
        return (guardiansData[_guardian].name, guardiansData[_guardian].website);
    }
}

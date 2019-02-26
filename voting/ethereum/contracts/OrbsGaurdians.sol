pragma solidity 0.5.3;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

interface IOrbsGuardians {
    function addGuardian(address _guardian) external;
    function isGuardian(address _guardian) external view returns (bool);
    function getGuardians() external view returns (address[] memory);
    function leave() external returns (bool);
}

interface IOrbsGuardiansRegistry {
    function setGuardianData(string calldata _name, string calldata _website) external;
    function getGuardianData(address _validator) external view returns (string memory _name, string memory _website);
}

contract OrbsGaurdians is Ownable, IOrbsGuardians, IOrbsGuardiansRegistry {

    struct GuardianData {
        string name;
        string website;
    }

    // The version of the current federation smart contract.
    uint public constant VERSION = 1;

    // Maximum number of the validators.
    uint public constant MAX_GUARDIANS = 100;

    event GuardianAdded(address indexed validator);
    event GuardianLeft(address indexed validator);

    address[] public guardians;
    mapping (address => GuardianData) public guardiansData;

    function addGuardian(address _guardian) public onlyOwner {
        require(_guardian != address(0), "Address must not be 0!");
        require(guardians.length <= MAX_GUARDIANS - 1, "Can't add more guardians!");

        require(!isGuardian(_guardian), "Address must not be already a guardian");

        guardians.push(_guardian);
        emit GuardianAdded(_guardian);
    }

    function isGuardian(address _guardian) public view returns (bool) {
        for (uint i = 0; i < guardians.length; ++i) {
            if (guardians[i] == _guardian) {
                return true;
            }
        }
        return false;
    }

    function getGuardians() public view returns (address[] memory) {
        return guardians;
    }

    function leave() public returns (bool) {
        for (uint i = 0; i < guardians.length; ++i) {
            if (guardians[i] == msg.sender) {
                guardians[i] = guardians[guardians.length - 1];
                delete guardiansData[msg.sender];
                delete guardians[i];
                guardians.length--;

                emit GuardianLeft(msg.sender);
                return true;
            }
        }
        return false;
    }

    function setGuardianData(string memory _name, string memory _website) public {
        require(bytes(_name).length > 0, "Please provide a valid name");
        require(bytes(_website).length > 0, "Please provide a valid website");

        require(isGuardian(msg.sender), "Caller must be a guardian");
        guardiansData[msg.sender] = GuardianData(_name, _website);
    }

    function getGuardianData(address _guardian) public view returns (string memory _name, string memory _website) {
        require(isGuardian(_guardian), "Please provide a listed Guardian");
        return (guardiansData[_guardian].name, guardiansData[_guardian].website);
    }
}

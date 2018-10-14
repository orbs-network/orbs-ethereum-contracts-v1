pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/// @title Upgradable smart contract pattern.
contract Upgradable is Ownable {
    /// @dev Upgrade flow: triggers the upgrade callback of the old contract.
    /// @param _newContract address The address of the new contract which going to replace this one.
    function upgrade(Upgradable _newContract) public onlyOwner {
        require(address(_newContract) != address(0), "Address must not be 0!");
        require(_newContract.owner() == owner, "The old and the new contracts should share the same owners!");
        require(address(_newContract) != address(this), "Can't upgrade to the same contract!");

        require(onUpgrade(_newContract), "Upgrade has failed!");
    }

    /// @dev A callback which will be called during an upgrade and will return the status of the of upgrade.
    function onUpgrade(Upgradable _newContract) internal returns (bool);
}

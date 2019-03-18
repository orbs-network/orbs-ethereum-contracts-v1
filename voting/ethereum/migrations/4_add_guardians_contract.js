var Guardians = artifacts.require("./OrbsGuardians.sol");

module.exports = function(deployer) {
  deployer.deploy(Guardians, web3.utils.toWei("1", "ether"));
};

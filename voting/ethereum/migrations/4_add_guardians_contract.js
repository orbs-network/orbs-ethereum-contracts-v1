var Guardians = artifacts.require("./OrbsGuardians.sol");

module.exports = function(deployer) {
  deployer.deploy(Guardians);
};

var Guardians = artifacts.require("./OrbsGaurdians.sol");

module.exports = function(deployer) {
  deployer.deploy(Guardians);
};

var Validators = artifacts.require("./OrbsValidators.sol");

module.exports = function(deployer) {
  deployer.deploy(Validators, 100);
};

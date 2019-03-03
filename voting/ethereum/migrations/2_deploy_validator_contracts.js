var Validators = artifacts.require("./OrbsValidators.sol");
var ValidatorsRegistry = artifacts.require("./OrbsValidatorsRegistry.sol");

module.exports = async function(deployer) {
  await deployer.deploy(ValidatorsRegistry);
  await deployer.deploy(Validators, ValidatorsRegistry.address, 100);
};

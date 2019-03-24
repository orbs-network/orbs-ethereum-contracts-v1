var Guardians = artifacts.require("./OrbsGuardians.sol");

module.exports = function(deployer) {
  const twoWeekInSeconds = 60*60*24*14;
  deployer.deploy(Guardians, web3.utils.toWei("1", "ether"), twoWeekInSeconds);
};

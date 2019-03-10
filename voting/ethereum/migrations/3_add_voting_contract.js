var Voting = artifacts.require("./OrbsVoting.sol");

module.exports = function(deployer) {
  deployer.deploy(Voting, 3);
};

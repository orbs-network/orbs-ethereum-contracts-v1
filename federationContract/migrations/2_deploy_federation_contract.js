var Voting = artifacts.require("./Federation.sol");

module.exports = function(deployer) {
  deployer.deploy(Voting);
};

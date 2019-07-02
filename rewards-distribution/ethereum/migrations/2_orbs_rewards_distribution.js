const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');
const ERC20 = artifacts.require('./TestingERC20');

module.exports = async function(deployer) {
    await deployer.deploy(ERC20);
    await deployer.deploy(OrbsRewardsDistribution, ERC20.address);
};

const DateTime = artifacts.require('./DateTime.sol');
const OrbsSubscriptions = artifacts.require('OrbsSubscriptions');

module.exports = async (deployer, network) => {
  // We're only using these migrations during development and testing.
  if (network !== 'development' && network !== 'coverage') { // TODO - do we need this?
    return;
  }

   await deployer.deploy(DateTime);
   await deployer.link(DateTime, OrbsSubscriptions)
};


const DateTime = artifacts.require('./DateTime.sol');
const SubscriptionManager = artifacts.require('../test/SubscriptionManager.sol');
const SubscriptionManagerMock = artifacts.require('../test/SubscriptionManagerMock.sol');

module.exports = async (deployer, network) => {
  // We're only using these migrations during development and testing.
  if (network !== 'development' && network !== 'coverage') {
    return;
  }

  await deployer.deploy(DateTime);
  await deployer.link(DateTime, SubscriptionManager);
  await deployer.link(DateTime, SubscriptionManagerMock);
};

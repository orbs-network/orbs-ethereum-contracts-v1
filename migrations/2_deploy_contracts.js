const DateTime = artifacts.require('./DateTime.sol');
const AutonomousSwapBridge = artifacts.require('./AutonomousSwapBridge.sol');
const AutonomousSwapProofVerifier = artifacts.require('./AutonomousSwapProofVerifier.sol');

const DateTimeWrapper = artifacts.require('../test/helpers/DateTimeWrapper.sol');
const SubscriptionManager = artifacts.require('../test/SubscriptionManager.sol');
const SubscriptionManagerMock = artifacts.require('../test/SubscriptionManagerMock.sol');

async function deploy(deployer, network) {
  // We're only using these migrations during development and testing.
  if (network !== 'development' && network !== 'coverage') {
    return;
  }

  await deployer.deploy(DateTime);
  await deployer.link(DateTime, DateTimeWrapper);
  await deployer.link(DateTime, SubscriptionManager);
  await deployer.link(DateTime, SubscriptionManagerMock);


  await deployer.deploy(AutonomousSwapProofVerifier);
  await deployer.link(AutonomousSwapProofVerifier, AutonomousSwapBridge);
}

module.exports = (deployer, network) => {
  deployer.then(async () => {
    await deploy(deployer, network);
  });
};

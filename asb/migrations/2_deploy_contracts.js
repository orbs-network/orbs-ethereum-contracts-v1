const BytesLibEx = artifacts.require('BytesLibEx');
const CryptoUtils = artifacts.require('CryptoUtils');
const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge');
const AutonomousSwapProofVerifier = artifacts.require('AutonomousSwapProofVerifier');
const Tet = artifacts.require('Tet');
const Federation= artifacts.require('Federation');


const deploy = async (deployer, network, accounts) => {
  // We're only using these migrations during development and testing.
  // if (network !== 'development' && network !== 'coverage') {
  //   return;
  // }


  await deployer.deploy([Tet, BytesLibEx, CryptoUtils]);
  await deployer.link(BytesLibEx, [AutonomousSwapProofVerifier, AutonomousSwapBridge])
  await deployer.link(CryptoUtils, [AutonomousSwapProofVerifier, AutonomousSwapBridge])
  await deployer.deploy(Federation, [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]]);
  await deployer.link(Federation, [AutonomousSwapProofVerifier, AutonomousSwapBridge])
  await deployer.link(Tet, AutonomousSwapBridge)
  await deployer.deploy(AutonomousSwapProofVerifier, Federation.address);
  await deployer.link(AutonomousSwapProofVerifier, AutonomousSwapBridge)
  await deployer.deploy(AutonomousSwapBridge, 0, 42, "asb_ether", Tet.address, Federation.address, AutonomousSwapProofVerifier.address);
};

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    await deploy(deployer, network, accounts);
  });
};

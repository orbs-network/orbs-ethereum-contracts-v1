/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const orbsAsbContractName = process.env.ORBS_ASB_CONTRACT_NAME;

const BytesLibEx = artifacts.require('BytesLibEx');
const CryptoUtils = artifacts.require('CryptoUtils');
const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
const AutonomousSwapProofVerifier = artifacts.require('AutonomousSwapProofVerifier.sol');
const Federation = artifacts.require('Federation.sol');

const deploy = async (deployer, network, accounts) => {
  await deployer.deploy(BytesLibEx);
  await deployer.deploy(CryptoUtils);
  await deployer.link(BytesLibEx, [AutonomousSwapProofVerifier, AutonomousSwapBridge]);
  await deployer.link(CryptoUtils, [AutonomousSwapProofVerifier, AutonomousSwapBridge]);
  await deployer.deploy(Federation, ["0xa328846cd5b4979d68a8c58a9bdfeee657b34de7"]);
  await deployer.link(Federation, [AutonomousSwapProofVerifier, AutonomousSwapBridge]);
  await deployer.deploy(AutonomousSwapProofVerifier, Federation.address);
  await deployer.link(AutonomousSwapProofVerifier, AutonomousSwapBridge);
  await deployer.deploy(AutonomousSwapBridge, 0, 42, orbsAsbContractName, erc20ContractAddress, Federation.address, AutonomousSwapProofVerifier.address);
};

module.exports = (deployer, network, accounts) => {
  if (!erc20ContractAddress) {
    throw("missing env variable ERC20_CONTRACT_ADDRESS");
  }

  if (!orbsAsbContractName) {
    throw("missing env variable ORBS_ASB_CONTRACT_NAME");
  }

  deployer.then(async () => {
    await deploy(deployer, network, accounts);
  });
};

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const DateTime = artifacts.require('./DateTime.sol');
const CryptoUtils = artifacts.require('./CryptoUtils.sol');
const AutonomousSwapProofVerifier = artifacts.require('./AutonomousSwapProofVerifier.sol');

const DateTimeWrapper = artifacts.require('../test/helpers/DateTimeWrapper.sol');
const SubscriptionManager = artifacts.require('../test/SubscriptionManager.sol');
const SubscriptionManagerMock = artifacts.require('../test/SubscriptionManagerMock.sol');
const CryptoUtilsWrapper = artifacts.require('../test/helpers/CryptoUtilsWrapper.sol');
const AutonomousSwapProofVerifierWrapper = artifacts.require('../test/helpers/AutonomousSwapProofVerifierWrapper.sol');

const deploy = async (deployer, network) => {
  // We're only using these migrations during development and testing.
  if (network !== 'development' && network !== 'coverage') {
    return;
  }

  await deployer.deploy(DateTime);
  await deployer.link(DateTime, DateTimeWrapper);
  await deployer.link(DateTime, SubscriptionManager);
  await deployer.link(DateTime, SubscriptionManagerMock);

  await deployer.deploy(CryptoUtils);
  await deployer.link(CryptoUtils, CryptoUtilsWrapper);
  await deployer.link(CryptoUtils, AutonomousSwapProofVerifier);
  await deployer.link(CryptoUtils, AutonomousSwapProofVerifierWrapper);
};

module.exports = (deployer, network) => {
  deployer.then(async () => {
    await deploy(deployer, network);
  });
};

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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


/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

module.exports = async function(done) {
  try {

    const validatorsRegistry = artifacts.require('OrbsValidatorsRegistry');
    let instanceValidatorsRegistry = await validatorsRegistry.new(20);

    const validators = artifacts.require('OrbsValidators');
    let instanceValidators = await validators.new(instanceValidatorsRegistry.address, 20);

    console.log(JSON.stringify({
      ValidatorsAddress: instanceValidators.address,
      ValidatorsRegistryAddress: instanceValidatorsRegistry.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

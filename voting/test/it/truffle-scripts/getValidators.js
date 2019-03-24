/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const validatorsContractAddress = process.env.VALIDATORS_CONTRACT_ADDRESS;
const validatorsRegistryContractAddress = process.env.VALIDATORS_REGISTRY_CONTRACT_ADDRESS;

module.exports = async function(done) {
  try {

    if (!validatorsContractAddress) {
      throw("missing env variable VALIDATORS_CONTRACT_ADDRESS");
    }

    if (!validatorsRegistryContractAddress) {
      throw("missing env variable VALIDATORS_REGISTRY_CONTRACT_ADDRESS");
    }

    let accounts = await web3.eth.getAccounts();
    let mapAddressToIndex = {};
    for (let i = 0;i < accounts.length;i++) {
      mapAddressToIndex[accounts[i].toLowerCase()] = i;
    }

    const validatorsInstance = await artifacts.require('IOrbsValidators').at(validatorsContractAddress);
    let validatorAddresses = await validatorsInstance.getValidators();

    const validatorsRegInstance = await artifacts.require('IOrbsValidatorsRegistry').at(validatorsRegistryContractAddress);

    let txs = validatorAddresses.map(address => {
        return validatorsRegInstance.getOrbsAddress(address).then(resAddr => {
          return { Index: mapAddressToIndex[address.toLowerCase()], Address: address, OrbsAddress: resAddr }
        });
    });

    let validators = await Promise.all(txs);
    console.log(JSON.stringify({validators}, null, 2));

    done();
  } catch (e) {
    console.log(e);
    done(e);
  }
};

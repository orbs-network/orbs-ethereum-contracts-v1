/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const Web3 = require('web3');
const Chance = require('chance');
const contractsInfo = require('./src/contracts-info');
const EthereumGuardiansContractJSON = require('./src/contracts/OrbsGuardians.json');
const EthereumValidatorsContractJSON = require('./src/contracts/OrbsValidators.json');
const EthreumValidatorsRegistryContractJSON = require('./src/contracts/OrbsValidatorsRegistry.json');

const from = '0x9D4dB91AaA3573A67Ff7604EAcfC73d03e2C9c7A';
const web3 = new Web3('http://localhost:7545');
const chance = new Chance();

const addGuardians = async (guardians, contract) => {
  await Promise.all(guardians.map(address => contract
    .methods
    .register(chance.name(), chance.url())
    .send({ from: address, gas: 6721975 })));
};

const approves = async (validators, contract, registryContract) => {
  await Promise.all(validators.map(address => contract
    .methods
    .approve(address)
    .send({ from })))

  await Promise.all(validators.map((address, idx) => registryContract
    .methods
    .register(
      chance.name(),
      ("0x" + idx + "00000000").slice(0, 10),
      chance.url(),
      address
    )
    .send({ from: address, gas: 6721975 })))
};

(async () => {
  const accounts = await web3.eth.getAccounts();

  const guardians = accounts.slice(0, 5);
  const validators = accounts.slice(5);

  const guardiansContract = new web3.eth.Contract(
    EthereumGuardiansContractJSON.abi,
    contractsInfo.EthereumGuardiansContract.address, { gas: 6721975 }
  );

  const validatorsContract = new web3.eth.Contract(
    EthereumValidatorsContractJSON.abi,
    contractsInfo.EthereumValidatorsContract.address, { gas: 6721975 }
  );

  const validatorsRegistryContract = new web3.eth.Contract(
    EthreumValidatorsRegistryContractJSON.abi,
    contractsInfo.EthereumValidatorsRegistryContract.address, { gas: 6721975 }
  );

  await addGuardians(guardians, guardiansContract);
  await approves(validators, validatorsContract, validatorsRegistryContract);

  process.exit();
})();
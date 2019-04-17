/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const Web3 = require('web3');
const contractsInfo = require('../contracts-info');
const votingContractJSON = require('../contracts/OrbsVoting.json');
const guardiansContractJSON = require('../contracts/OrbsGuardians.json');
const validatorsContractJSON = require('../contracts/OrbsValidators.json');
const validatorsRegistryContractJSON = require('../contracts/OrbsValidatorsRegistry.json');

const FIRST_ELECTION_BLOCK_HEIGHT = 7528900;
const INTERVAL_BETWEEN_ELECTIONS = 20000;
const VALID_VOTE_LENGTH = 45500;

class EthereumClientService {
  constructor(url) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(url));
    this.guardiansContract = new this.web3.eth.Contract(
      guardiansContractJSON.abi,
      contractsInfo.EthereumGuardiansContract.address
    );
    this.votingContract = new this.web3.eth.Contract(
      votingContractJSON.abi,
      contractsInfo.EthereumVotingContract.address
    );
    this.validatorsContract = new this.web3.eth.Contract(
      validatorsContractJSON.abi,
      contractsInfo.EthereumValidatorsContract.address
    );
    this.validatorsRegistryContract = new this.web3.eth.Contract(
      validatorsRegistryContractJSON.abi,
      contractsInfo.EthereumValidatorsRegistryContract.address
    );
  }
  getGuardians(offset, limit) {
    return this.guardiansContract.methods.getGuardians(offset, limit).call();
  }
  async getGuardianData(address) {
    const [
      guardianData,
      currentVote,
      nextElectionsBlockHeight
    ] = await Promise.all([
      this.guardiansContract.methods.getGuardianData(address).call(),
      this.votingContract.methods.getCurrentVote(address).call(),
      this.getNextElectionsBlockHeight()
    ]);
    const votedAtBlockHeight = parseInt(currentVote.blockNumber);
    return Object.assign({}, guardianData, {
      hasEligibleVote:
        votedAtBlockHeight + VALID_VOTE_LENGTH > nextElectionsBlockHeight
    });
  }
  getValidators() {
    return this.validatorsContract.methods.getValidators().call();
  }
  getValidatorData(address) {
    return this.validatorsRegistryContract.methods
      .getValidatorData(address)
      .call();
  }

  async getNextElectionsBlockHeight() {
    let amountOfElections = 0;
    let nextElectionsBlockHeight = 0;
    const currentBlockHeight = await this.web3.eth.getBlockNumber();
    while (nextElectionsBlockHeight < currentBlockHeight) {
      amountOfElections += 1;
      nextElectionsBlockHeight =
        FIRST_ELECTION_BLOCK_HEIGHT +
        INTERVAL_BETWEEN_ELECTIONS * amountOfElections;
    }
    return nextElectionsBlockHeight;
  };
}

module.exports = {
  EthereumClientService
};

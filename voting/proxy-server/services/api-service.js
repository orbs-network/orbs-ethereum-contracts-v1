/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const { NON_DELEGATED } = require('./ethereum-client');

class ApiService {
  constructor(ethereumClient, orbsClientService) {
    this.ethereumClient = ethereumClient;
    this.orbsClientService = orbsClientService;
  }

  async getValidators() {
    return await this.ethereumClient.getValidators();
  }

  async getValidatorInfo(address) {
    const data = await ethereumClient.getValidatorData(address);

    const [validatorVotesResults, totalStakeResults] = await Promise.all([
      orbsClientService.getValidatorVotes(address),
      orbsClientService.getTotalStake()
    ]);

    if (totalStakeResults === 0n) {
      data['votesAgainst'] = '0';
    } else {
      data['votesAgainst'] = (
        (100n * validatorVotesResults) /
        totalStakeResults
      ).toString();
    }
    return data;
  }

  async getTotalStake() {
    return await this.orbsClientService.getTotalStake();
  }

  async getRewards(address) {
    const [
      delegatorReward,
      guardianReward,
      validatorReward
    ] = await Promise.all([
      this.orbsClient.getParticipationReward(address),
      this.orbsClient.getGuardianReward(address),
      this.orbsClient.getValidatorReward(address)
    ]);

    return {
      delegatorReward: delegatorReward.toString(),
      guardianReward: guardianReward.toString(),
      validatorReward: validatorReward.toString(),
      totalReward: (
        delegatorReward +
        guardianReward +
        validatorReward
      ).toString()
    };
  }

  async getRewardsHistory(address) {
    return await ethereumClient.getOrbsRewardsDistribution(address);
  }

  async getGuardiansList(offset, limit) {
    return await this.ethereumClient.getGuardians(offset, limit);
  }

  async getGuardianInfo(address) {
    const data = await this.ethereumClient.getGuardianData(address);

    const [votingWeightResults, totalStakeResults] = await Promise.all([
      this.orbsClientService.getGuardianVoteWeight(address),
      this.orbsClientService.getTotalStake()
    ]);

    // Todo: what do we do with bigint on the browser? does orbsClient really return bigint??
    data['voted'] = votingWeightResults !== 0n;

    if (totalStakeResults === 0n) {
      data['stake'] = 0;
    } else {
      data['stake'] = Number(votingWeightResults) / Number(totalStakeResults);
    }
    return data;
  }

  async getNextElectionsBlockHeight() {
    return await this.ethereumService.getNextElectionsBlockHeight();
  }

  async getPastElectionBlockHeight() {
    return await this.orbsClientService.getEffectiveElectionBlockNumber();
  }

  async getDelegationStatus(address) {
    let info;
    info = await this.ethereumClient.getCurrentDelegationByDelegate(address);
    if (info.delegatedTo === NON_DELEGATED) {
      info = await this.ethereumClient.getCurrentDelegationByTransfer(address);
    }

    return info.delegatedTo;
  }

  async getDelegationInfo(address) {
    let info;
    info = await this.ethereumClient.getCurrentDelegationByDelegate(address);
    if (info.delegatedTo === NON_DELEGATED) {
      info = await this.ethereumClient.getCurrentDelegationByTransfer(address);
      info.delegationType = 'Transfer';
    } else {
      info.delegationType = 'Delegate';
    }
    const balance = await this.ethereumClient.getOrbsBalance(address);
    info.delegatorBalance = new Intl.NumberFormat('en').format(balance);
    return info;
  }

  async getElectedValidators() {
    const data = await this.orbsClientService.getElectedValidators();
    const addresses = [];
    const ADDRESS_LENGTH = 20;
    for (let i = 0; i < data.length; i += ADDRESS_LENGTH) {
      addresses.push(`0x${data.slice(i, i + ADDRESS_LENGTH).toString('hex')}`);
    }
    return addresses;
  }

  async getElectedValidatorInfo(address) {
    const validatorData = await this.ethereumClient.getValidatorData(address);
    const stake = await this.orbsClientService.getValidatorStake(address);

    const result = Object.assign({}, validatorData, {
      stake: stake.toString()
    });
    return result;
  }
}

module.exports = ApiService;
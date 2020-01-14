/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { encodeHex } from 'orbs-client-sdk';
import { IElectedValidatorInfo } from '../interfaces/IElectedValidatorInfo';
import { IEthereumClientService } from '../interfaces/IEthereumClientService';
import { IOrbsClientService } from '../interfaces/IOrbsClientService';
import { IOrbsPOSDataService } from '../interfaces/IOrbsPOSDataService';
import { IRewards } from '../interfaces/IRewards';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import { IValidatorData } from '../interfaces/IValidatorData';
import { IValidatorInfo } from '../interfaces/IValidatorInfo';

export class OrbsPOSDataService implements IOrbsPOSDataService {
  constructor(private ethereumClient: IEthereumClientService, private orbsClientService: IOrbsClientService) {}

  async getValidators(): Promise<string[]> {
    return await this.ethereumClient.getValidators();
  }

  async getValidatorInfo(validatorAddress: string): Promise<IValidatorInfo> {
    const validatorData: IValidatorData = await this.ethereumClient.getValidatorData(validatorAddress);
    const result: IValidatorInfo = { votesAgainst: 0, ...validatorData };

    const [validatorVotesResults, totalParticipatingTokens] = await Promise.all([
      this.orbsClientService.getValidatorVotes(validatorAddress),
      this.orbsClientService.getTotalParticipatingTokens(),
    ]);

    if (totalParticipatingTokens !== BigInt(0)) {
      result.votesAgainst = Number((BigInt(100) * validatorVotesResults) / totalParticipatingTokens);
    }
    return result;
  }

  async getTotalParticipatingTokens(): Promise<number> {
    return Number(await this.orbsClientService.getTotalParticipatingTokens());
  }

  async getRewards(address: string): Promise<IRewards> {
    const [delegatorReward, guardianReward, validatorReward] = await Promise.all([
      this.orbsClientService.getParticipationReward(address),
      this.orbsClientService.getGuardianReward(address),
      this.orbsClientService.getValidatorReward(address),
    ]);

    return {
      delegatorReward: Number(delegatorReward),
      guardianReward: Number(guardianReward),
      validatorReward: Number(validatorReward),
    };
  }

  async getRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]> {
    return await this.ethereumClient.getOrbsRewardsDistribution(address);
  }

  async getUpcomingElectionBlockNumber(): Promise<number> {
    return await this.ethereumClient.getUpcomingElectionBlockNumber();
  }

  async getEffectiveElectionBlockNumber(): Promise<number> {
    return await this.orbsClientService.getEffectiveElectionBlockNumber();
  }

  async getElectedValidators(): Promise<string[]> {
    const data = await this.orbsClientService.getElectedValidators();
    const addresses = [];
    const ADDRESS_LENGTH = 20;
    for (let i = 0; i < data.length; i += ADDRESS_LENGTH) {
      const address = data.slice(i, i + ADDRESS_LENGTH);
      addresses.push(encodeHex(address).toLowerCase());
    }
    return addresses;
  }

  async getElectedValidatorInfo(validatorAddress: string): Promise<IElectedValidatorInfo> {
    const validatorData = await this.ethereumClient.getValidatorData(validatorAddress);
    const stake = await this.orbsClientService.getValidatorStake(validatorAddress);

    const result = {
      name: validatorData.name,
      ipAddress: validatorData.ipAddress,
      website: validatorData.website,
      orbsAddress: validatorData.orbsAddress,
      stake: Number(stake),
    };
    return result;
  }

  async getOrbsBalance(address: string): Promise<string> {
    return this.ethereumClient.getOrbsBalance(address);
  }

  subscribeToORBSBalanceChange(address: string, callback: (newBalance: string) => void): () => void {
    return this.ethereumClient.subscribeToORBSBalanceChange(address, callback);
  }
}

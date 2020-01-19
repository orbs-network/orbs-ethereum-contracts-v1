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

  async readValidators(): Promise<string[]> {
    return await this.ethereumClient.readValidators();
  }

  async readValidatorInfo(validatorAddress: string): Promise<IValidatorInfo> {
    const validatorData: IValidatorData = await this.ethereumClient.readValidatorData(validatorAddress);
    const result: IValidatorInfo = { votesAgainst: 0, ...validatorData };

    const [validatorVotesResults, totalParticipatingTokens] = await Promise.all([
      this.orbsClientService.readValidatorVotes(validatorAddress),
      this.orbsClientService.readTotalParticipatingTokens(),
    ]);

    if (totalParticipatingTokens !== BigInt(0)) {
      result.votesAgainst = Number((BigInt(100) * validatorVotesResults) / totalParticipatingTokens);
    }
    return result;
  }

  async readTotalParticipatingTokens(): Promise<number> {
    return Number(await this.orbsClientService.readTotalParticipatingTokens());
  }

  async readRewards(address: string): Promise<IRewards> {
    const [delegatorReward, guardianReward, validatorReward] = await Promise.all([
      this.orbsClientService.readParticipationReward(address),
      this.orbsClientService.readGuardianReward(address),
      this.orbsClientService.readValidatorReward(address),
    ]);

    return {
      delegatorReward: Number(delegatorReward),
      guardianReward: Number(guardianReward),
      validatorReward: Number(validatorReward),
    };
  }

  async readRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]> {
    return await this.ethereumClient.readOrbsRewardsDistribution(address);
  }

  async readUpcomingElectionBlockNumber(): Promise<number> {
    return await this.ethereumClient.readUpcomingElectionBlockNumber();
  }

  async readEffectiveElectionBlockNumber(): Promise<number> {
    return await this.orbsClientService.readEffectiveElectionBlockNumber();
  }

  async readElectedValidators(): Promise<string[]> {
    const data = await this.orbsClientService.readElectedValidators();
    const addresses = [];
    const ADDRESS_LENGTH = 20;
    for (let i = 0; i < data.length; i += ADDRESS_LENGTH) {
      const address = data.slice(i, i + ADDRESS_LENGTH);
      addresses.push(encodeHex(address).toLowerCase());
    }
    return addresses;
  }

  async readElectedValidatorInfo(validatorAddress: string): Promise<IElectedValidatorInfo> {
    const validatorData = await this.ethereumClient.readValidatorData(validatorAddress);
    const stake = await this.orbsClientService.readValidatorStake(validatorAddress);

    const result = {
      name: validatorData.name,
      ipAddress: validatorData.ipAddress,
      website: validatorData.website,
      orbsAddress: validatorData.orbsAddress,
      stake: Number(stake),
    };
    return result;
  }

  async readOrbsBalance(address: string): Promise<string> {
    return this.ethereumClient.readOrbsBalance(address);
  }

  subscribeToORBSBalanceChange(address: string, callback: (newBalance: string) => void): () => void {
    return this.ethereumClient.subscribeToORBSBalanceChange(address, callback);
  }
}

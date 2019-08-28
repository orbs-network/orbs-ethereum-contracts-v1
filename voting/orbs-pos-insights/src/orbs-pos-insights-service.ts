/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { EthereumClientService, IValidatorData, IRewardsDistributionEvent, IGuardianData, IDelegationData } from "./ethereum-client";
import { OrbsClientService } from "./orbs-client";
import { encodeHex } from 'orbs-client-sdk';

const { NON_DELEGATED } = require("./ethereum-client");

export interface IRewards {
  delegatorReward: number;
  guardianReward: number;
  validatorReward: number;
  totalReward: number;
}

export interface IValidatorInfo {
  name: string;
  ipAddress: string;
  website: string;
  orbsAddress: string;
  votesAgainst: number;
}

export interface IElectedValidatorInfo {
  name: string;
  ipAddress: string;
  website: string;
  orbsAddress: string;
  stake: number;
}

export interface IGuardianInfo {
  name: string;
  website: string;
  hasEligibleVote: boolean;
  voted: boolean;
  stake: number;
}

export interface IDelegationInfo {
  delegatedTo: string;
  delegationType: "Transfer" | "Delegate";
  delegatorBalance: number;
  delegationBlockNumber?: number;
  delegationTimestamp?: number;
}

export class OrbsPOSInsightsService {
  constructor(private ethereumClient: EthereumClientService, private orbsClientService: OrbsClientService) {}

  async getValidators(): Promise<string[]> {
    return await this.ethereumClient.getValidators();
  }

  async getValidatorInfo(address: string): Promise<IValidatorInfo> {
    const validatorData: IValidatorData = await this.ethereumClient.getValidatorData(address);
    const result: IValidatorInfo = { votesAgainst: 0, ...validatorData };

    const [validatorVotesResults, totalStakeResults] = await Promise.all([this.orbsClientService.getValidatorVotes(address), this.orbsClientService.getTotalStake()]);

    if (totalStakeResults !== BigInt(0)) {
      result.votesAgainst = Number((BigInt(100) * validatorVotesResults) / totalStakeResults);
    }
    return result;
  }

  async getTotalStake(): Promise<number> {
    return Number(await this.orbsClientService.getTotalStake());
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
      totalReward: Number(delegatorReward + guardianReward + validatorReward),
    };
  }

  async getRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]> {
    return await this.ethereumClient.getOrbsRewardsDistribution(address);
  }

  async getGuardiansList(offset: number, limit: number): Promise<string[]> {
    return await this.ethereumClient.getGuardians(offset, limit);
  }

  async getGuardianInfo(address: string): Promise<IGuardianInfo> {
    const guardianData: IGuardianData = await this.ethereumClient.getGuardianData(address);

    const [votingWeightResults, totalStakeResults] = await Promise.all([this.orbsClientService.getGuardianVoteWeight(address), this.orbsClientService.getTotalStake()]);

    const result: IGuardianInfo = {
      voted: votingWeightResults !== BigInt(0),
      stake: 0,
      ...guardianData,
    };

    if (totalStakeResults !== BigInt(0)) {
      result.stake = Number(votingWeightResults) / Number(totalStakeResults);
    }

    return result;
  }

  async getNextElectionsBlockHeight(): Promise<number> {
    return await this.ethereumClient.getNextElectionsBlockHeight();
  }

  async getPastElectionBlockHeight(): Promise<number> {
    return await this.orbsClientService.getEffectiveElectionBlockNumber();
  }

  async getDelegationStatus(address: string): Promise<string> {
    let info: IDelegationData = await this.ethereumClient.getCurrentDelegationByDelegate(address);
    if (info.delegatedTo === NON_DELEGATED) {
      info = await this.ethereumClient.getCurrentDelegationByTransfer(address);
    }

    return info.delegatedTo;
  }

  async getDelegationInfo(address: string): Promise<IDelegationInfo> {
    let info: IDelegationData = await this.ethereumClient.getCurrentDelegationByDelegate(address);
    let delegationType: "Transfer" | "Delegate";
    if (info.delegatedTo === NON_DELEGATED) {
      info = await this.ethereumClient.getCurrentDelegationByTransfer(address);
      delegationType = "Transfer";
    } else {
      delegationType = "Delegate";
    }

    const balance = await this.ethereumClient.getOrbsBalance(address);
    return {
      delegatorBalance: Number(balance),
      delegationType,
      ...info
    };
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

  async getElectedValidatorInfo(address: string): Promise<IElectedValidatorInfo> {
    const validatorData = await this.ethereumClient.getValidatorData(address);
    const stake = await this.orbsClientService.getValidatorStake(address);

    const result = {
      name: validatorData.name,
      ipAddress: validatorData.ipAddress,
      website: validatorData.website,
      orbsAddress: validatorData.orbsAddress,
      stake: Number(stake),
    };
    return result;
  }
}
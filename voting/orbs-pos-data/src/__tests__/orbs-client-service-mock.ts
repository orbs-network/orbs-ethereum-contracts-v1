import { threadId } from "worker_threads";
import { IOrbsClientService } from '../IOrbsClientService';

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

export class OrbsClientServiceMock implements IOrbsClientService {
  private validatorsVotesMap: { [address: string]: bigint } = {};
  private totalTokens: bigint;

  async getTotalParticipatingTokens(): Promise<bigint> {
    return this.totalTokens;
  }

  async getGuardianVoteWeight(address: string): Promise<bigint> {
    return null;
  }

  async getValidatorVotes(address: string): Promise<bigint> {
    return this.validatorsVotesMap[address];
  }

  async getValidatorStake(address: string): Promise<bigint> {
    return null;
  }

  async getElectedValidators(): Promise<Uint8Array> {
    return null;
  }

  async getParticipationReward(address: string): Promise<bigint> {
    return null;
  }

  async getGuardianReward(address: string): Promise<bigint> {
    return null;
  }

  async getValidatorReward(address: string): Promise<bigint> {
    return null;
  }

  async getEffectiveElectionBlockNumber(): Promise<number> {
    return null;
  }

  withValidatorVotes(validatorAddress: string, votes: bigint): this {
    this.validatorsVotesMap[validatorAddress] = votes;
    return this;
  }

  withTotalParticipatingTokens(totalTokens: bigint): this {
    this.totalTokens = totalTokens;
    return this;
  }
}

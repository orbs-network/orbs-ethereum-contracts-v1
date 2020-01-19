import { threadId } from "worker_threads";
import { IOrbsClientService } from '../interfaces/IOrbsClientService';

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

  async readTotalParticipatingTokens(): Promise<bigint> {
    return this.totalTokens;
  }

  async readGuardianVoteWeight(address: string): Promise<bigint> {
    return null;
  }

  async readValidatorVotes(address: string): Promise<bigint> {
    return this.validatorsVotesMap[address];
  }

  async readValidatorStake(address: string): Promise<bigint> {
    return null;
  }

  async readElectedValidators(): Promise<Uint8Array> {
    return null;
  }

  async readParticipationReward(address: string): Promise<bigint> {
    return null;
  }

  async readGuardianReward(address: string): Promise<bigint> {
    return null;
  }

  async readValidatorReward(address: string): Promise<bigint> {
    return null;
  }

  async readEffectiveElectionBlockNumber(): Promise<number> {
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

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { argAddress, Argument, Client } from 'orbs-client-sdk';
import { IOrbsClientService } from '../interfaces/IOrbsClientService';

export class OrbsClientService implements IOrbsClientService {
  constructor(private orbsClient: Client) {}

  private async buildQuery(methodName: string, args: Argument[]): Promise<Uint8Array> {
    return this.orbsClient.createQuery('_Elections', methodName, args);
  }

  private async sendQuery<T extends string | number | bigint | Uint8Array>(query: Uint8Array) {
    const results = await this.orbsClient.sendQuery(query);
    return results.outputArguments[0].value as T;
  }

  async readTotalParticipatingTokens(): Promise<bigint> {
    const query = await this.buildQuery('getTotalStake', []);
    return this.sendQuery(query);
  }

  async readGuardianVoteWeight(address: string): Promise<bigint> {
    const query = await this.buildQuery('getGuardianVotingWeight', [argAddress(address.toLowerCase())]);
    return this.sendQuery(query);
  }

  async readValidatorVotes(address: string): Promise<bigint> {
    const query = await this.buildQuery('getValidatorVote', [argAddress(address.toLowerCase())]);
    return this.sendQuery(query);
  }

  async readValidatorStake(address: string): Promise<bigint> {
    const query = await this.buildQuery('getValidatorStake', [argAddress(address.toLowerCase())]);
    return this.sendQuery(query);
  }

  async readElectedValidators(): Promise<Uint8Array> {
    const query = await this.buildQuery('getElectedValidatorsEthereumAddress', []);
    return this.sendQuery(query);
  }

  async readParticipationReward(address: string): Promise<bigint> {
    const query = await this.buildQuery('getCumulativeParticipationReward', [argAddress(address.toLowerCase())]);
    return this.sendQuery(query);
  }

  async readGuardianReward(address: string): Promise<bigint> {
    const query = await this.buildQuery('getCumulativeGuardianExcellenceReward', [argAddress(address.toLowerCase())]);
    return this.sendQuery(query);
  }

  async readValidatorReward(address: string): Promise<bigint> {
    const query = await this.buildQuery('getCumulativeValidatorReward', [argAddress(address.toLowerCase())]);
    return this.sendQuery(query);
  }

  async readEffectiveElectionBlockNumber(): Promise<number> {
    const query = await this.buildQuery('getEffectiveElectionBlockNumber', []);
    return this.sendQuery(query);
  }
}

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { Account, argAddress, Argument, Client, createAccount } from 'orbs-client-sdk';
import contractsInfo from './contracts-info';
import { IOrbsClientService } from './IOrbsClientService';

export class OrbsClientService implements IOrbsClientService {
  private orbsAccount: Account;

  constructor(private orbsClient: Client) {
    this.orbsAccount = createAccount();
  }

  private buildQuery(methodName: string, args: Argument[]): Uint8Array {
    return this.orbsClient.createQuery(
      this.orbsAccount.publicKey,
      contractsInfo.OrbsVotingContract.name,
      methodName,
      args
    );
  }

  private async sendQuery<T extends string | number | bigint | Uint8Array>(query: Uint8Array) {
    const results = await this.orbsClient.sendQuery(query);
    return results.outputArguments[0].value as T;
  }

  getTotalParticipatingTokens(): Promise<bigint> {
    const query = this.buildQuery('getTotalStake', []);
    return this.sendQuery(query);
  }

  getGuardianVoteWeight(address: string): Promise<bigint> {
    const query = this.buildQuery('getGuardianVotingWeight', [
      argAddress(address.toLowerCase())
    ]);
    return this.sendQuery(query);
  }

  getValidatorVotes(address: string): Promise<bigint> {
    const query = this.buildQuery('getValidatorVote', [
      argAddress(address.toLowerCase())
    ]);
    return this.sendQuery(query);
  }

  getValidatorStake(address: string): Promise<bigint> {
    const query = this.buildQuery('getValidatorStake', [
      argAddress(address.toLowerCase())
    ]);
    return this.sendQuery(query);
  }

  getElectedValidators(): Promise<Uint8Array> {
    const query = this.buildQuery('getElectedValidatorsEthereumAddress', []);
    return this.sendQuery(query);
  }

  getParticipationReward(address: string): Promise<bigint> {
    const query = this.buildQuery('getCumulativeParticipationReward', [
      argAddress(address.toLowerCase())
    ]);
    return this.sendQuery(query);
  }

  getGuardianReward(address: string): Promise<bigint> {
    const query = this.buildQuery('getCumulativeGuardianExcellenceReward', [
      argAddress(address.toLowerCase())
    ]);
    return this.sendQuery(query);
  }

  getValidatorReward(address: string): Promise<bigint> {
    const query = this.buildQuery('getCumulativeValidatorReward', [
      argAddress(address.toLowerCase())
    ]);
    return this.sendQuery(query);
  }

  getEffectiveElectionBlockNumber(): Promise<number> {
    const query = this.buildQuery('getEffectiveElectionBlockNumber', []);
    return this.sendQuery(query);
  }
}

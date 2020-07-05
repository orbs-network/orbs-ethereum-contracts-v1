/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { IElectedValidatorInfo } from './IElectedValidatorInfo';
import { IRewards } from './IRewards';
import { IRewardsDistributionEvent } from './IRewardsDistributionEvent';
import { IValidatorInfo } from './IValidatorInfo';

export interface IOrbsPOSDataService {
  readValidators(): Promise<string[]>;
  readValidatorInfo(validatorAddress: string): Promise<IValidatorInfo>;
  readTotalParticipatingTokens(): Promise<bigint>;

  /**
   * // TODO : ON_MAJOR_RELEASE : Remove this function
   * @deprecated Please use the 'OrbsRewardsService'
   */
  readRewards(address: string): Promise<IRewards>;
  /**
   * // TODO : ON_MAJOR_RELEASE : Remove this function
   * @deprecated Please use the 'OrbsRewardsService'
   */
  readRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]>;
  readUpcomingElectionBlockNumber(): Promise<number>;
  readEffectiveElectionBlockNumber(): Promise<number>;
  readElectedValidators(): Promise<string[]>;
  readElectedValidatorInfo(validatorAddress: string): Promise<IElectedValidatorInfo>;
  readOrbsBalance(address: string): Promise<bigint>;
  subscribeToORBSBalanceChange(address: string, callback: (newBalance: bigint) => void): () => void;
}

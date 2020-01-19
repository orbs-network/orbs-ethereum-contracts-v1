/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { IDelegationInfo } from './IDelegationInfo';
import { IElectedValidatorInfo } from './IElectedValidatorInfo';
import { IGuardianInfo } from './IGuardianInfo';
import { IRewards } from './IRewards';
import { IRewardsDistributionEvent } from './IRewardsDistributionEvent';
import { IValidatorInfo } from './IValidatorInfo';

export interface IOrbsPOSDataService {
  readValidators(): Promise<string[]>;
  readValidatorInfo(validatorAddress: string): Promise<IValidatorInfo>;
  readTotalParticipatingTokens(): Promise<number>;
  readRewards(address: string): Promise<IRewards>;
  readRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]>;
  readUpcomingElectionBlockNumber(): Promise<number>;
  readEffectiveElectionBlockNumber(): Promise<number>;
  readElectedValidators(): Promise<string[]>;
  readElectedValidatorInfo(validatorAddress: string): Promise<IElectedValidatorInfo>;
  readOrbsBalance(address: string): Promise<string>;
  subscribeToORBSBalanceChange(address: string, callback: (newBalance: string) => void): () => void;
}

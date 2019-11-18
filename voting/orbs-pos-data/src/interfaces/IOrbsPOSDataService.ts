/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { IDelegationInfo } from "./IDelegationInfo";
import { IElectedValidatorInfo } from "./IElectedValidatorInfo";
import { IGuardianInfo } from "./IGuardianInfo";
import { IRewards } from "./IRewards";
import { IRewardsDistributionEvent } from './IRewardsDistributionEvent';
import { IValidatorInfo } from "./IValidatorInfo";

export interface IOrbsPOSDataService {
  getValidators(): Promise<string[]>;
  getValidatorInfo(validatorAddress: string): Promise<IValidatorInfo>;
  getTotalParticipatingTokens(): Promise<number>;
  getRewards(address: string): Promise<IRewards>;
  getRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]>;
  getGuardiansList(offset: number, limit: number): Promise<string[]>;
  getGuardianInfo(guardianAddress: string): Promise<IGuardianInfo>;
  getUpcomingElectionBlockNumber(): Promise<number>;
  getEffectiveElectionBlockNumber(): Promise<number>;
  getDelegatee(address: string): Promise<string>;
  getDelegationInfo(address: string): Promise<IDelegationInfo>;
  getElectedValidators(): Promise<string[]>;
  getElectedValidatorInfo(validatorAddress: string): Promise<IElectedValidatorInfo>;
}

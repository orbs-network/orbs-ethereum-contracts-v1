import { IGuardianData } from './IGuardianData';
import { IElectedValidatorData, IValidatorData } from './IValidatorData';
import { IGuardianInfo } from 'orbs-pos-data';

// DEV_NOTE : O.L : This type is inferred from returned values.
//                  we should create proper types.
export type TCurrentDelegationInfo = {
  delegatedTo: string;
  delegationType: string;
  delegationBlockNumber: number;
  delegationTimestamp: number;
  delegatorBalance: number;
};

// DEV_NOTE : O.L : This type is inferred from returned values.
//                  we should create proper types.
export type TRewardsSummary = {
  delegatorReward: number;
  guardianReward: number;
  validatorReward: number;
};

export interface IRemoteService {
  getGuardians(): Promise<string[]>;
  getGuardianData(address: string): Promise<IGuardianInfo>;
  getValidators(): Promise<string[]>;
  getElectedValidators(): Promise<string[]>;
  getValidatorData(address: string): Promise<IValidatorData>;
  getElectedValidatorData(address: string): Promise<IElectedValidatorData>;
  getRewards(address: string): Promise<TRewardsSummary>;
  getRewardsHistory(address: string): Promise<any>;
  getTotalParticipatingTokens(): Promise<string>;
  getUpcomingElectionBlockNumber(): Promise<string>;
  getEffectiveElectionBlockNumber(): Promise<string>;
  getCurrentDelegation(address: string): Promise<string>;
  getCurrentDelegationInfo(address: string): Promise<TCurrentDelegationInfo>;
}

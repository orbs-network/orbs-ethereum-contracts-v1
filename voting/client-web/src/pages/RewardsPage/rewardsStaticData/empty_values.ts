import { IGuardianInfo, IRewardsDistributionEvent } from 'orbs-pos-data';
import { TRewardsSummary } from '../../../services/IRemoteService';

export const EMPTY_GUARDIAN_INFO: IGuardianInfo = {
  'website': '',
  'hasEligibleVote': false,
  'name': '',
  'stakePercent': 0,
  'voted': false,
};

export const EMPTY_DELEGATOR_INFO = {
  'delegatorBalance': 0,
  'delegationType': 'Not-Delegated',
  'delegatedTo': '0x0000000000000000000000000000000000000000',
};

export const EMPTY_STAKING_INFO = {
  'stakedOrbs': 0,
};

export const EMPTY_REWARDS_SUMMARY: TRewardsSummary = {
  "delegatorReward": 0,
  "guardianReward": 0,
  "validatorReward": 0
}

export const EMPTY_DISTRIBUTION_HISTORY : IRewardsDistributionEvent[] = [];
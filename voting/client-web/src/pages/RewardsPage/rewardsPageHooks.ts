/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  IGuardianInfo,
  IGuardiansService,
  IOrbsRewardsService,
  IRewardsDistributionEvent,
  IStakingService,
} from 'orbs-pos-data';
import { useEffect } from 'react';
import { useBoolean, useStateful } from 'react-hanger';
import { useApi } from '../../services/ApiContext';
import { IRemoteService, TCurrentDelegationInfo, TRewardsSummary } from '../../services/IRemoteService';
import { fullOrbsFromWeiOrbs } from '../../cryptoUtils/unitConverter';
import { IGuardianData } from '../../services/IGuardianData';
import { useGuardiansStore } from '../../Store/storeHooks';
import { useGuardiansService } from '../../services/ServicesHooks';

export type TStakingInfo = {
  stakedOrbs: number;
};

export type TCompleteAddressInfoForRewardsPage = {
  hasActiveDelegation: boolean;
  delegatorInfo: TCurrentDelegationInfo;
  guardianInfo?: IGuardianInfo;
  stakingInfo: TStakingInfo;
  rewardsSummary: TRewardsSummary;
  distributionsHistory: IRewardsDistributionEvent[];
};

const emptyObject: TCompleteAddressInfoForRewardsPage = {
  distributionsHistory: [],
  delegatorInfo: {
    delegatedTo: '',
    delegationBlockNumber: 0,
    delegationTimestamp: 0,
    delegationType: '',
    delegatorBalance: 0,
  },
  hasActiveDelegation: false,
  stakingInfo: {
    stakedOrbs: 0,
  },
  guardianInfo: {
    website: '',
    hasEligibleVote: false,
    name: '',
    stakePercent: 0,
    voted: false,
  },
  rewardsSummary: {
    validatorReward: 0,
    guardianReward: 0,
    delegatorReward: 0,
  },
};

export type TUseCompleteAddressInfoForRewardsPage = (
  address?: string,
) => { addressData: TCompleteAddressInfoForRewardsPage; errorLoading: boolean };

export const useCompleteAddressInfoForRewardsPage: TUseCompleteAddressInfoForRewardsPage = (address) => {
  const errorLoading = useBoolean(false);
  const addressData = useStateful<TCompleteAddressInfoForRewardsPage>(emptyObject);
  const guardianService = useGuardiansService();

  const { orbsRewardsService, remoteService, stakingService } = useApi();

  useEffect(() => {
    if (address) {
      readCompleteDataForAddress(address, orbsRewardsService, remoteService, stakingService, guardianService)
        .then(addressData.setValue)
        .catch(errorLoading.setTrue);
    }
  }, [
    address,
    addressData.setValue,
    errorLoading.setTrue,
    guardianService,
    orbsRewardsService,
    remoteService,
    stakingService,
  ]);

  if (!address) {
    return {
      addressData: emptyObject,
      errorLoading: false,
    };
  }

  return {
    addressData: addressData.value,
    errorLoading: errorLoading.value,
  };
};

const fetchRewardsHistory = async (address: string, orbsRewardsService: IOrbsRewardsService) => {
  return await orbsRewardsService.readRewardsDistributionsHistory(address);
};

const fetchDelegationAndGuardianInfo = async (
  address: string,
  remoteService: IRemoteService,
  guardiansService: IGuardiansService,
) => {
  const delegatorInfo = await remoteService.getCurrentDelegationInfo(address);
  let guardianInfo: IGuardianInfo;
  let hasActiveDelegation: boolean;

  if (delegatorInfo.delegationType === 'Not-Delegated') {
    guardianInfo = {
      website: '',
      hasEligibleVote: false,
      name: '',
      stakePercent: 0,
      voted: false,
    };
    hasActiveDelegation = false;
  } else {
    guardianInfo = await guardiansService.readGuardianInfo(delegatorInfo.delegatedTo);
    console.log({ guardianInfo });
    hasActiveDelegation = true;
  }

  return { delegatorInfo, guardianInfo, hasActiveDelegation };
};

const fetchStakingInfo = async (address: string, stakingService: IStakingService) => {
  const stakedOrbsInWeiOrbs = await stakingService.readStakeBalanceOf(address);
  const fullStakedOrbs = fullOrbsFromWeiOrbs(stakedOrbsInWeiOrbs);
  return {
    stakedOrbs: fullStakedOrbs,
  };
};

const fetchRewardsSummary = async (address: string, remoteService: IRemoteService) => {
  const rewardsSummary = await remoteService.getRewards(address);
  return rewardsSummary;
};

const readCompleteDataForAddress = async (
  address: string,
  orbsRewardsService: IOrbsRewardsService,
  remoteService: IRemoteService,
  stakingService: IStakingService,
  guardiansService: IGuardiansService,
) => {
  const rewardsHistory = await fetchRewardsHistory(address, orbsRewardsService);
  const delegationAndGuardianInfo = await fetchDelegationAndGuardianInfo(address, remoteService, guardiansService);
  const stakingInfo = await fetchStakingInfo(address, stakingService);
  const rewardsSummary = await fetchRewardsSummary(address, remoteService);

  const { hasActiveDelegation, guardianInfo, delegatorInfo } = delegationAndGuardianInfo;

  const addressData: TCompleteAddressInfoForRewardsPage = {
    distributionsHistory: rewardsHistory,
    delegatorInfo,
    guardianInfo,
    hasActiveDelegation,
    stakingInfo,
    rewardsSummary,
  };

  return addressData;
};

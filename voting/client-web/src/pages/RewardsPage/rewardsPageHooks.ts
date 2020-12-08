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
  delegatingToValidGuardian: boolean;
  delegatorInfo: TCurrentDelegationInfo;
  guardianInfo?: IGuardianInfo;
  stakingInfo: TStakingInfo;
  rewardsSummary: TRewardsSummary;
  distributionsHistory: IRewardsDistributionEvent[];
};

// DEV_NOTE : O.L : This was added for the V1 state preserving
export type TCompleteAddressInfoForRewardsPageWithAddress = TCompleteAddressInfoForRewardsPage & { address: string };

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
  delegatingToValidGuardian: false,
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
  const guardiansStore = useGuardiansStore();

  const { orbsRewardsService, remoteService, stakingService } = useApi();

  useEffect(() => {
    if (address) {
      readCompleteDataForAddress(
        address,
        orbsRewardsService,
        remoteService,
        stakingService,
        guardianService,
        guardiansStore.guardiansAddresses,
      )
        .then(addressData.setValue)
        .catch(errorLoading.setTrue);
    }
  }, [
    address,
    addressData.setValue,
    errorLoading.setTrue,
    guardianService,
    guardiansStore.guardiansAddresses,
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
  validGuardianAddresses: string[],
) => {
  // Initialize with empty data
  let guardianInfo: IGuardianInfo = {
    website: '',
    hasEligibleVote: false,
    name: '',
    stakePercent: 0,
    voted: false,
  };
  let hasActiveDelegation: boolean;
  let delegatingToValidGuardian = false;

  let delegatorInfo: TCurrentDelegationInfo;

  // DEV_NOTE : O.L : This 'graceful failure' was added for the extraction of all v1 data.
  //                  There was one address that always got 500 response.
  try {
    delegatorInfo = await remoteService.getCurrentDelegationInfo(address);
  } catch (e) {
    console.error(`WARNING: Could not get delegation info for ${address}`);
    delegatorInfo = {
      delegatorBalance:0.0,
      delegationType:"Not-Delegated",
      delegatedTo:"0x0000000000000000000000000000000000000000",
      delegationBlockNumber: 0,
      delegationTimestamp: 0,
    }
  }

  if (delegatorInfo.delegationType === 'Not-Delegated') {
    hasActiveDelegation = false;
  } else {
    const guardianAddress = delegatorInfo.delegatedTo;

    // DEV_NOTE : O.L : This check was added after an edge case where a delegator was found delegating to a Guardian that
    //                  has left.
    delegatingToValidGuardian = validGuardianAddresses.includes(guardianAddress.toLowerCase());

    if (delegatingToValidGuardian) {
      try {
        guardianInfo = await guardiansService.readGuardianInfo(delegatorInfo.delegatedTo);
      } catch (e) {
        console.warn(`Failed reading guardian {${delegatorInfo.delegatedTo} info`);
      }
    } else {
      console.warn(`Delegating to a non-guardian address of ${guardianAddress}`);
    }

    hasActiveDelegation = true;
  }

  return { delegatorInfo, guardianInfo, hasActiveDelegation, delegatingToValidGuardian };
}

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

export const readCompleteDataForAddress = async (
  address: string,
  orbsRewardsService: IOrbsRewardsService,
  remoteService: IRemoteService,
  stakingService: IStakingService,
  guardiansService: IGuardiansService,
  validGuardianAddresses: string[],
) => {
  // console.log(JSON.stringify(validGuardianAddresses));
  const rewardsHistory = await fetchRewardsHistory(address, orbsRewardsService);
  const delegationAndGuardianInfo = await fetchDelegationAndGuardianInfo(
    address,
    remoteService,
    guardiansService,
    validGuardianAddresses,
  );
  const stakingInfo = await fetchStakingInfo(address, stakingService);
  const rewardsSummary = await fetchRewardsSummary(address, remoteService);

  const { hasActiveDelegation, guardianInfo, delegatorInfo, delegatingToValidGuardian } = delegationAndGuardianInfo;

  const addressData: TCompleteAddressInfoForRewardsPage & { address: string } = {
    address,
    distributionsHistory: rewardsHistory,
    delegatorInfo,
    guardianInfo,
    hasActiveDelegation,
    delegatingToValidGuardian,
    stakingInfo,
    rewardsSummary,
  };

  return addressData;
};

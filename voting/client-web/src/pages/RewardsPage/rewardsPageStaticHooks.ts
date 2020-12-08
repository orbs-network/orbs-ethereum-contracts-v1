import { useBoolean, useStateful } from 'react-hanger';
import { useGuardiansService } from '../../services/ServicesHooks';
import { useGuardiansStore } from '../../Store/storeHooks';
import { useApi } from '../../services/ApiContext';
import { useEffect, useMemo } from 'react';
import {
  emptyCompleteAddressInfoForRewardsPage,
  readCompleteDataForAddress,
  TCompleteAddressInfoForRewardsPage, TStakingInfo,
  TUseCompleteAddressInfoForRewardsPage,
} from './rewardsPageHooks';
import { useQuery } from 'react-query';
import { IDelegationInfo } from 'orbs-pos-data/dist/interfaces/IDelegationInfo';
import { TCurrentDelegationInfo, TRewardsSummary } from '../../services/IRemoteService';
import { IGuardianInfo, IRewardsDistributionEvent } from 'orbs-pos-data';

export const useCompleteAddressInfoForRewardsPageFromStaticData = (address) => {
  const hasActiveDelegation = useHasActiveDelegation(address);
  const delegatingToValidGuardian = useIsDelegatingToValidGuardian(address);
  const delegatorInfo = useStaticDelegatorInfo(address);
  const distributionHistory = useStaticDistributionHistory(address);
  const guardianInfo = useStaticGuardianInfo(address);
  const rewardsSummary = useStaticRewardsSummary(address);
  const stakingInfo = useStaticStakingInfo(address);

  const staticDataForAddress = useMemo(() => {
    const clonedData: TCompleteAddressInfoForRewardsPage = { ...emptyCompleteAddressInfoForRewardsPage };

    clonedData.hasActiveDelegation = hasActiveDelegation ?? false;
    clonedData.delegatingToValidGuardian = delegatingToValidGuardian ?? false;
    clonedData.delegatorInfo = delegatorInfo ? delegatorInfo : clonedData.delegatorInfo;
    clonedData.distributionsHistory = distributionHistory ? distributionHistory : clonedData.distributionsHistory;
    clonedData.guardianInfo = guardianInfo ? guardianInfo : clonedData.guardianInfo;
    clonedData.rewardsSummary = rewardsSummary ? rewardsSummary : clonedData.rewardsSummary;
    clonedData.stakingInfo = stakingInfo ? stakingInfo : clonedData.stakingInfo;

    return clonedData;
  }, [hasActiveDelegation, delegatingToValidGuardian, delegatorInfo, distributionHistory, guardianInfo, rewardsSummary, stakingInfo]);

  return staticDataForAddress;
};

const useHasActiveDelegation = (address: string) => {
  const { isLoading, error, data } = useQuery('hasActiveDelegationSet', () =>
    fetch('/staticRewardsData/hasActiveDelegationSet.json').then(async (res) => {
      // console.log({ res });
      const jsonRes = await res.json();
      // console.log({jsonRes})

      return jsonRes;
    }),
  );

  if (error) {
    console.error('Has error !' + error);
  }

  if (isLoading) {
    // console.log('Hook is loading');
    return null;
  }

  if (data) {
    const addressesWithActiveDelegation: string[] = data;
    // console.log('Has data');

    if (addressesWithActiveDelegation.includes(address)) {
      return true;
    } else {
      return false;
    }
  }
};

const useIsDelegatingToValidGuardian = (address: string) => {
  const { isLoading, error, data } = useQuery('delegatingToValidGuardianSet', () =>
    fetch('/staticRewardsData/delegatingToValidGuardianSet.json').then(async (res) => {
      // console.log({ res });
      const jsonRes = await res.json();
      // console.log({jsonRes})

      return jsonRes;
    }),
  );

  if (error) {
    console.error('Has error !' + error);
  }

  if (isLoading) {
    // console.log('Hook is loading');
    return null;
  }

  if (data) {
    const addressesWithDelegationToValidGuardian: string[] = data;
    // console.log('Has data');

    if (addressesWithDelegationToValidGuardian.includes(address)) {
      return true;
    } else {
      return false;
    }
  }
};

const useStaticDelegatorInfo = (address: string) => {
  const { isLoading, error, data } = useQuery('delegatorInfoMap', () =>
    fetch('/staticRewardsData/delegatorInfoMap.json').then(async (res) => {
      // console.log({ res });
      const jsonRes = await res.json();
      // console.log({jsonRes})

      return jsonRes;
    }),
  );

  if (error) {
    console.error('Has error !' + error);
  }

  if (isLoading) {
    // console.log('Hook is loading');
    return null;
  }

  if (data) {
    const delegatorsInfoRecord: Record<string, TCurrentDelegationInfo> = data;
    // console.log('Has data');

    return delegatorsInfoRecord[address];
  }
};

const useStaticDistributionHistory = (address: string) => {
  const { isLoading, error, data } = useQuery('distributionHistoryMap', () =>
    fetch('/staticRewardsData/distributionHistoryMap.json').then(async (res) => {
      // console.log({ res });
      const jsonRes = await res.json();
      // console.log({jsonRes})

      return jsonRes;
    }),
  );

  if (error) {
    console.error('Has error !' + error);
  }

  if (isLoading) {
    // console.log('Hook is loading');
    return null;
  }

  if (data) {
    const distributionHistoryRecord: Record<string, IRewardsDistributionEvent[]> = data;
    // console.log('Has data');

    return distributionHistoryRecord[address];
  }
};

const useStaticGuardianInfo = (address: string) => {
  const { isLoading, error, data } = useQuery('guardianInfoMap', () =>
    fetch('/staticRewardsData/guardianInfoMap.json').then(async (res) => {
      // console.log({ res });
      const jsonRes = await res.json();
      // console.log({jsonRes})

      return jsonRes;
    }),
  );

  if (error) {
    console.error('Has error !' + error);
  }

  if (isLoading) {
    // console.log('Hook is loading');
    return null;
  }

  if (data) {
    const guardianInfoRecord: Record<string, IGuardianInfo> = data;
    // console.log('Has data');

    return guardianInfoRecord[address];
  }
};

const useStaticRewardsSummary = (address: string) => {
  const { isLoading, error, data } = useQuery('rewardsSummaryMap', () =>
    fetch('/staticRewardsData/rewardsSummaryMap.json').then(async (res) => {
      // console.log({ res });
      const jsonRes = await res.json();
      // console.log({jsonRes})

      return jsonRes;
    }),
  );

  if (error) {
    console.error('Has error !' + error);
  }

  if (isLoading) {
    // console.log('Hook is loading');
    return null;
  }

  if (data) {
    const rewardsSummaryRecord: Record<string, TRewardsSummary> = data;
    // console.log('Has data');

    return rewardsSummaryRecord[address];
  }
};

const useStaticStakingInfo = (address: string) => {
  const { isLoading, error, data } = useQuery('stakingInfoMap', () =>
    fetch('/staticRewardsData/stakingInfoMap.json').then(async (res) => {
      // console.log({ res });
      const jsonRes = await res.json();
      // console.log({jsonRes})

      return jsonRes;
    }),
  );

  if (error) {
    console.error('Has error !' + error);
  }

  if (isLoading) {
    // console.log('Hook is loading');
    return null;
  }

  if (data) {
    const stakingInfoRecord: Record<string, TStakingInfo> = data;
    // console.log('Has data');

    return stakingInfoRecord[address];
  }
};


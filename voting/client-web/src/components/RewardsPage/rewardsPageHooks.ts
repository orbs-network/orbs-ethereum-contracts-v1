/* eslint-disable @typescript-eslint/no-use-before-define */
import { IOrbsRewardsService, IRewardsDistributionEvent } from 'orbs-pos-data';
import { useEffect } from 'react';
import { useBoolean, useStateful } from 'react-hanger';
import { useApi } from '../../services/ApiContext';
import { IRemoteService } from '../../services/IRemoteService';

export type TCompleteAddressInfoForRewardsPage = {
  distributionsHistory: IRewardsDistributionEvent[];
  // TODO : Break this to parts
  dng: any;
};

const emptyObject: TCompleteAddressInfoForRewardsPage = {
  distributionsHistory: [],
  dng: {},
};

export type TUseCompleteAddressInfoForRewardsPage = (
  address?: string,
) => { addressData: TCompleteAddressInfoForRewardsPage; errorLoading: boolean };

export const useCompleteAddressInfoForRewardsPage: TUseCompleteAddressInfoForRewardsPage = address => {
  const errorLoading = useBoolean(false);
  const addressData = useStateful<TCompleteAddressInfoForRewardsPage>(emptyObject);

  const { orbsRewardsService, remoteService } = useApi();

  useEffect(() => {
    if (address) {
      readCompleteDataForAddress(address, orbsRewardsService, remoteService)
        .then(addressData.setValue)
        .catch(errorLoading.setTrue);
    }
  }, [address, addressData.setValue, errorLoading.setTrue, orbsRewardsService, remoteService]);

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

const fetchDelegationAndGuardianInfo = async (address: string, remoteService: IRemoteService) => {
  const delegatorInfo = await remoteService.getCurrentDelegationInfo(address);
  let guardianInfo: any;
  let hasActiveDelegation: boolean;

  if (delegatorInfo.delegationType === 'Not-Delegated') {
    guardianInfo = {};
    hasActiveDelegation = false;
  } else {
    guardianInfo = await remoteService.getGuardianData(delegatorInfo.delegatedTo);
    hasActiveDelegation = true;
  }

  return { delegatorInfo, guardianInfo, hasActiveDelegation };
};

const readCompleteDataForAddress = async (
  address: string,
  orbsRewardsService: IOrbsRewardsService,
  remoteService: IRemoteService,
) => {
  const rewardsHistory = await fetchRewardsHistory(address, orbsRewardsService);
  const delegationAndGuardianInfo = await fetchDelegationAndGuardianInfo(address, remoteService);

  const addressData: TCompleteAddressInfoForRewardsPage = {
    distributionsHistory: rewardsHistory,
    dng: delegationAndGuardianInfo,
  };

  return addressData;
};

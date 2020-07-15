/* eslint-disable @typescript-eslint/no-use-before-define */
import { IOrbsRewardsService, IRewardsDistributionEvent } from 'orbs-pos-data';
import { useEffect } from 'react';
import { useBoolean, useStateful } from 'react-hanger';
import { useApi } from '../../services/ApiContext';

export type TCompleteAddressInfoForRewardsPage = {
  distributionsHistory: IRewardsDistributionEvent[];
};

const emptyObject: TCompleteAddressInfoForRewardsPage = {
  distributionsHistory: [],
};

export type TUseCompleteAddressInfoForRewardsPage = (
  address?: string,
) => { addressData: TCompleteAddressInfoForRewardsPage; errorLoading: boolean };

export const useCompleteAddressInfoForRewardsPage: TUseCompleteAddressInfoForRewardsPage = address => {
  const errorLoading = useBoolean(false);
  const addressData = useStateful<TCompleteAddressInfoForRewardsPage>(emptyObject);

  const { orbsRewardsService } = useApi();

  useEffect(() => {
    if (address) {
      readCompleteDataForAddress(address, orbsRewardsService)
        .then(addressData.setValue)
        .catch(errorLoading.setTrue);
    }
  }, [address, addressData.setValue, errorLoading.setTrue, orbsRewardsService]);

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

const readCompleteDataForAddress = async (address: string, orbsRewardsService: IOrbsRewardsService) => {
  const rewardsHistory = await fetchRewardsHistory(address, orbsRewardsService);

  const addressData: TCompleteAddressInfoForRewardsPage = {
    distributionsHistory: rewardsHistory,
  };

  return addressData;
};

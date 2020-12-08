import { useBoolean, useStateful } from 'react-hanger';
import { useGuardiansService } from '../../services/ServicesHooks';
import { useGuardiansStore } from '../../Store/storeHooks';
import { useApi } from '../../services/ApiContext';
import { useEffect, useMemo } from 'react';
import {
  emptyCompleteAddressInfoForRewardsPage,
  readCompleteDataForAddress,
  TCompleteAddressInfoForRewardsPage,
  TUseCompleteAddressInfoForRewardsPage,
} from './rewardsPageHooks';
import { useQuery } from 'react-query';

export const useCompleteAddressInfoForRewardsPageFromStaticData = (address) => {
  // const staticDataForAddress = useStateful<TCompleteAddressInfoForRewardsPage>(emptyCompleteAddressInfoForRewardsPage);

  const hasActiveDelegation = useHasActiveDelegation(address);
  const  delegatingToValidGuardian = useIsDelegatingToValidGuardian(address);

  console.log({hasActiveDelegation})
  console.log({delegatingToValidGuardian})

  const staticDataForAddress = useMemo(() => {
      const clonedData: TCompleteAddressInfoForRewardsPage = {...emptyCompleteAddressInfoForRewardsPage};

      clonedData.hasActiveDelegation = hasActiveDelegation ?? false;
      clonedData.delegatingToValidGuardian = delegatingToValidGuardian ?? false;

      return clonedData;
  }, [hasActiveDelegation, delegatingToValidGuardian,]);

  // useEffect(() => {
  //   const clonedData: TCompleteAddressInfoForRewardsPage = {...staticDataForAddress.value};
  //
  //   clonedData.hasActiveDelegation = hasActiveDelegation ?? false;
  //   clonedData.delegatingToValidGuardian = delegatingToValidGuardian ?? false;
  //
  //   staticDataForAddress.setValue(clonedData);
  // }, [hasActiveDelegation, delegatingToValidGuardian, staticDataForAddress]);

  console.log({staticDataForAddress})
  return staticDataForAddress;

  // const errorLoading = useBoolean(false);
  // const addressData = useStateful<TCompleteAddressInfoForRewardsPage>(emptyObject);
  // const guardianService = useGuardiansService();
  // const guardiansStore = useGuardiansStore();

  // const { orbsRewardsService, remoteService, stakingService } = useApi();

  // useEffect(() => {
  //   if (address) {
  //     readCompleteDataForAddress(
  //       address,
  //       orbsRewardsService,
  //       remoteService,
  //       stakingService,
  //       guardianService,
  //       guardiansStore.guardiansAddresses,
  //     )
  //       .then(addressData.setValue)
  //       .catch(errorLoading.setTrue);
  //   }
  // }, [
  //   address,
  //   addressData.setValue,
  //   errorLoading.setTrue,
  //   guardianService,
  //   guardiansStore.guardiansAddresses,
  //   orbsRewardsService,
  //   remoteService,
  //   stakingService,
  // ]);
  //
  // if (!address) {
  //   return {
  //     addressData: emptyObject,
  //     errorLoading: false,
  //   };
  // }
  //
  // return {
  //   addressData: addressData.value,
  //   errorLoading: errorLoading.value,
  // };
};

const useHasActiveDelegation = (address: string) => {
  const { isLoading, error, data } = useQuery('hasActiveDelegationSet', () =>
    fetch('/staticRewardsData/hasActiveDelegationSet.json').then(async res => {
        // console.log({ res });
        const jsonRes = await res.json();
        // console.log({jsonRes})

        return jsonRes;
      }
    )
  )

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
}

const useIsDelegatingToValidGuardian = (address: string) => {
  const { isLoading, error, data } = useQuery('delegatingToValidGuardianSet', () =>
    fetch('/staticRewardsData/delegatingToValidGuardianSet.json').then(async res => {
        // console.log({ res });
        const jsonRes = await res.json();
        // console.log({jsonRes})

        return jsonRes;
      }
    )
  )

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
}
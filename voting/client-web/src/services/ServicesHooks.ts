import React from 'react';
import { MobXProviderContext } from 'mobx-react';
import { IGuardiansService, IOrbsRewardsService, IStakingService } from 'orbs-pos-data';
import { IServices } from './Services';
import { IRemoteService } from './IRemoteService';
import { IMetamask } from './IMetamask';
import { IStakingRewardsService } from '@orbs-network/contracts-js';

export function useServices(): IServices {
  return React.useContext(MobXProviderContext) as IServices;
}

export function useGuardiansService(): IGuardiansService {
  return useServices().guardiansService;
}

export function useRemoteService(): IRemoteService {
  return useServices().remoteService;
}

export function useMetaMaskService(): IMetamask | undefined {
  return useServices().metamask;
}

export function useStakingService(): IStakingService {
  return useServices().stakingService;
}

export function useOrbsRewardsServiceService(): IOrbsRewardsService {
  return useServices().orbsRewardsService;
}

export function useOrbsStakingRewardsService(): IStakingRewardsService {
  return useServices().stakingRewardsService;
}

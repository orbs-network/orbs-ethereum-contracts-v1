import { createContext, useContext } from 'react';
import { IMetamask } from './IMetamask';
import { IRemoteService } from './IRemoteService';
import { IGuardiansService, IOrbsRewardsService, IStakingService } from 'orbs-pos-data';

export const ApiContext = createContext<{
  remoteService: IRemoteService;
  stakingService: IStakingService;
  orbsRewardsService: IOrbsRewardsService;
  guardiansService: IGuardiansService;
  metamask?: IMetamask;
}>(null!);
export const useApi = () => {
  return useContext(ApiContext);
};

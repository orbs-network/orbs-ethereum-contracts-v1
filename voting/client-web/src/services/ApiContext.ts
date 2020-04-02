import { createContext, useContext } from 'react';
import { IMetamask } from './IMetamask';
import { IRemoteService } from './IRemoteService';
import { IGuardiansService, IStakingService } from 'orbs-pos-data';

export const ApiContext = createContext<{
  remoteService: IRemoteService;
  stakingService: IStakingService;
  guardiansService: IGuardiansService;
  metamask?: IMetamask;
}>(null!);
export const useApi = () => {
  return useContext(ApiContext);
};

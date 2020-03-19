import { createContext, useContext } from 'react';
import { IMetamask } from './IMetamask';
import { IRemoteService } from './IRemoteService';
import { IStakingService } from 'orbs-pos-data';

export const ApiContext = createContext<{
  remoteService: IRemoteService;
  stakingService: IStakingService;
  metamask?: IMetamask;
}>(null!);
export const useApi = () => {
  return useContext(ApiContext);
};

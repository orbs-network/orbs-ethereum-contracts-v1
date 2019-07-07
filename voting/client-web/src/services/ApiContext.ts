import { createContext, useContext } from 'react';
import { IMetamask } from './IMetamask';
import { IRemoteService } from './IRemoteService';

export const ApiContext = createContext<{ remoteService: IRemoteService; metamask?: IMetamask }>(null!);
export const useApi = () => {
  return useContext(ApiContext);
};

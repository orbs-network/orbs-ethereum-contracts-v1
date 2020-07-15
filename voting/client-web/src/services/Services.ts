// DEV_NOTE : This file will handle the "well-designed" services, all of the other services will be eventually added to here.

import {
  GuardiansService,
  IGuardiansService,
  IOrbsClientService,
  IOrbsRewardsService,
  IStakingService,
  OrbsClientService,
  OrbsRewardsService,
  StakingService,
} from 'orbs-pos-data';
import Web3 from 'web3';
import { BuildOrbsClient } from './OrbsClientFactory';
import { IRemoteService } from './IRemoteService';
import { RemoteService } from './RemoteService';
import { configs } from '../config';
import { MetamaskService } from './MetamaskService';
import { IMetamask } from './IMetamask';

export interface IServices {
  remoteService: IRemoteService;
  guardiansService: IGuardiansService;
  metamask?: IMetamask;
  stakingService: IStakingService;
  orbsRewardsService: IOrbsRewardsService;
}

export function buildServices(web3: Web3, ethereumProvider: any): IServices {
  const remoteService: IRemoteService = new RemoteService(configs.orbsAuditNodeEndpoint);
  // TODO : FUTURE: O.L : This method of signaling no meta-mask is too fragile and unclear, change it to be like staking wallet
  const metamask = ethereumProvider ? new MetamaskService(web3) : undefined;
  const stakingService = new StakingService(web3, configs?.contractsAddressesOverride?.stakingContract);
  const orbsClient = BuildOrbsClient();
  const orbsClientService: IOrbsClientService = new OrbsClientService(orbsClient);
  const orbsRewardsService: IOrbsRewardsService = new OrbsRewardsService(web3, orbsClientService);
  const guardiansService = new GuardiansService(
    web3,
    orbsClientService,
    configs?.contractsAddressesOverride,
    configs.earliestBlockForDelegationOverride
      ? {
          earliestBlockForDelegation: configs.earliestBlockForDelegationOverride,
        }
      : undefined,
  );

  const services: IServices = {
    guardiansService,
    remoteService,
    metamask,
    stakingService,
    orbsRewardsService,
  };

  return services;
}

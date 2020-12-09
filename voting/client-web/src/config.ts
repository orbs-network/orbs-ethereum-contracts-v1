import { IOrbsPosContractsAddresses } from 'orbs-pos-data';

/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
type TSupportedNets = 'local' | 'ropsten' | 'mainnet';
// @ts-ignore
const ethereumNetwork: TSupportedNets = process.env.REACT_APP_ETHEREUM_NETWORK;

const IS_DEV =
  // @ts-ignore
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging' && !process.env.REACT_APP_FORCE_PROD;

const SHOULD_OVERRIDE_WITH_LOCAL_ADDRESS = IS_DEV || ethereumNetwork === 'local';

////////////// CONFIG VARIABLES ///////////////

// Remote endpoint
const orbsAuditNodeEndpoint_dev = 'http://localhost:5678/api';
const orbsAuditNodeEndpoint_prod = 'https://orbs-voting-proxy-server.herokuapp.com/api';

///////////////////////////////////////////////

export interface IConfig {
  orbsAuditNodeEndpoint: string;
  staticDataRelativePath: string;
  ETHEREUM_PROVIDER_WS: string;
  contractsAddressesOverride: Partial<IOrbsPosContractsAddresses & { stakingContract: string }> | undefined;
  v2ContractsAddressesOverride: {
    stakingRewardsContactAddress?: string;
  };
  earliestBlockForDelegationOverride?: number;
}

const contractsAddressesOverride: Partial<IOrbsPosContractsAddresses & { stakingContract: string }> | undefined = IS_DEV
  ? {
      stakingContract: '0x88287444f10709f9531D11e08DCd692deccd1d63', // ROPSTEN
      erc20Contract: '0xeD0Aa9A4F9e5ae9092994f4B86F6AAa89944939b', // ROPSTEN
      guardiansContract: '0x636315bcD912B1DbFe38E6b75f5B6AEE4Cd63B30', // ROPSTEN
      votingContract: '0xF90a738CA659Fe99E357cB7F47Aaa5cB9b5724a2', // ROPSTEN
    }
  : undefined;

const configsObject: IConfig = {
  orbsAuditNodeEndpoint: IS_DEV ? orbsAuditNodeEndpoint_dev : orbsAuditNodeEndpoint_prod,
  staticDataRelativePath: IS_DEV ? '/staticRewardsData/' : '/v1-snapshot/staticRewardsData/',
  ETHEREUM_PROVIDER_WS: 'wss://mainnet.infura.io/ws/v3/3fe9b03bd8374639809addf2164f7287',
  contractsAddressesOverride,
  // Only override in dev
  earliestBlockForDelegationOverride: IS_DEV ? 0 : undefined,
  v2ContractsAddressesOverride: {},
};

if (SHOULD_OVERRIDE_WITH_LOCAL_ADDRESS) {
  const addresses = require('./local/addresses.json');

  configsObject.v2ContractsAddressesOverride.stakingRewardsContactAddress = addresses.stakingRewards;
}

export const configs: IConfig = configsObject;

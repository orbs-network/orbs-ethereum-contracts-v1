/* eslint-disable @typescript-eslint/camelcase */
import { IOrbsPosContractsAddresses } from 'orbs-pos-data';

/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const IS_DEV =
  // @ts-ignore
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging' && !process.env.REACT_APP_FORCE_PROD;

////////////// CONFIG VARIABLES ///////////////

// Remote endpoint
const orbsAuditNodeEndpoint_dev = 'http://localhost:5678/api';
const orbsAuditNodeEndpoint_prod = 'https://orbs-voting-proxy-server.herokuapp.com/api';

///////////////////////////////////////////////

export interface IConfig {
  orbsAuditNodeEndpoint: string;
  ETHEREUM_PROVIDER_WS: string;
  contractsAddressesOverride: Partial<IOrbsPosContractsAddresses & { stakingContract: string }>;
}

const contractsAddressesOverride: Partial<IOrbsPosContractsAddresses & { stakingContract: string }> = IS_DEV
  ? {
      stakingContract: '0x88287444f10709f9531D11e08DCd692deccd1d63', // ROPSTEN
    }
  : {};

export const configs: IConfig = {
  orbsAuditNodeEndpoint: IS_DEV ? orbsAuditNodeEndpoint_dev : orbsAuditNodeEndpoint_prod,
  ETHEREUM_PROVIDER_WS: 'wss://mainnet.infura.io/ws/v3/3fe9b03bd8374639809addf2164f7287',
  contractsAddressesOverride,
};

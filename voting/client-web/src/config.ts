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
}

export const configs: IConfig = {
  orbsAuditNodeEndpoint: IS_DEV ? orbsAuditNodeEndpoint_dev : orbsAuditNodeEndpoint_prod,
};

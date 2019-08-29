/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { OrbsPOSDataService } from './orbs-pos-data-service';
import { EthereumClientService } from './ethereum-client';
import { OrbsClientService } from './orbs-client';

export function orbsPOSDataServiceFactory(
  ethereumProviderUrl: string,
  orbsNodeAddress: string = '18.197.127.2',
  virtualChainId: number = 1100000
) {
  const ethereumClient = new EthereumClientService(ethereumProviderUrl);

  const orbsClientService = new OrbsClientService(
    orbsNodeAddress,
    virtualChainId
  );

  return new OrbsPOSDataService(ethereumClient, orbsClientService);
}

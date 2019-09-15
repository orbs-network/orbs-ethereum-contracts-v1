/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { Client } from "orbs-client-sdk";
import Web3 from "web3";
import { EthereumClientService } from "./ethereum-client";
import { OrbsClientService } from "./orbs-client";
import { OrbsPOSDataService } from "./orbs-pos-data-service";
import { IEthereumClientService } from "./IEthereumClientService";

export function orbsPOSDataServiceFactory(web3: Web3, orbsClient: Client) {
  const ethereumClient: IEthereumClientService = new EthereumClientService(web3);
  const orbsClientService = new OrbsClientService(orbsClient);

  return new OrbsPOSDataService(ethereumClient, orbsClientService);
}

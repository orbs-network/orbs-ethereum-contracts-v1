/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { Client, NetworkType } from "orbs-client-sdk";
import { EthereumClientService } from "./ethereum-client";
import { OrbsClientService } from "./orbs-client";
import { OrbsPOSDataService } from "./orbs-pos-data-service";
import Web3 from "web3";

export function orbsPOSDataServiceFactoryIOC(web3: Web3, orbsClient: Client) {
  const ethereumClient = new EthereumClientService(web3);
  const orbsClientService = new OrbsClientService(orbsClient);

  return new OrbsPOSDataService(ethereumClient, orbsClientService);
}

export function orbsPOSDataServiceFactory(ethereumProviderUrl: string, orbsNodeAddress: string = "18.197.127.2", virtualChainId: number = 1100000) {
  const web3 = new Web3(new Web3.providers.HttpProvider(ethereumProviderUrl));

  // create the orbs-client-sdk
  const orbsNodeUrl = `http://${orbsNodeAddress}/vchains/${virtualChainId.toString()}`;
  const orbsClient = new Client(orbsNodeUrl, virtualChainId, NetworkType.NETWORK_TYPE_TEST_NET);

  return orbsPOSDataServiceFactoryIOC(web3, orbsClient);
}

/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { IEthereumClientService } from '../IEthereumClientService';
import { OrbsPOSDataService } from '../orbs-pos-data-service';
import { EthereumClientServiceMock } from './ethereum-client-service-mock';
import { IOrbsClientService } from '../IOrbsClientService';
import { OrbsClientServiceMock } from './orbs-client-service-mock';

describe("Orbs POS data service", () => {
  describe("getValidators", () => {
    it("should return all the validators addresses", async () => {
      const ethereumClinet: IEthereumClientService = new EthereumClientServiceMock();
      const orbsClientService: IOrbsClientService = new OrbsClientServiceMock();
      const orbsPOSDataService: OrbsPOSDataService = new OrbsPOSDataService(ethereumClinet, orbsClientService);
      const actual = await orbsPOSDataService.getValidators();
      expect(actual).toEqual([]);
    });
  });
});

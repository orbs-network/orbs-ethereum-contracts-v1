/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { OrbsPOSDataService, IValidatorInfo } from "../orbs-pos-data-service";
import { EthereumClientServiceMock } from "./ethereum-client-service-mock";
import { OrbsClientServiceMock } from "./orbs-client-service-mock";

describe("Orbs POS data service", () => {
  let ethereumClinet: EthereumClientServiceMock;
  let orbsClientService: OrbsClientServiceMock;
  let orbsPOSDataService: OrbsPOSDataService;

  const validatorsMap: {[key: string]: IValidatorInfo} = {
    '0x0874BC1383958e2475dF73dC68C4F09658E23777': {
      orbsAddress: "0x8287928a809346dF4Cd53A096025a1136F7C4fF5",
      name: "validator #1",
      ipAddress: "1.2.3.4",
      website: "http://www.validator1.com",
      votesAgainst: 0,
    },
    '0xf257EDE1CE68CA4b94e18eae5CB14942CBfF7D1C': {
      orbsAddress: "0xf7ae622C77D0580f02Bcb2f92380d61e3F6e466c",
      name: "validator #2",
      ipAddress: "5.6.7.8",
      website: "http://www.validator2.com",
      votesAgainst: 0,
    },
    '0xcB6172196BbCf5b4cf9949D7f2e4Ee802EF2b81D': {
      orbsAddress: "0x63AEf7616882F488BCa97361d1c24F05B4657ae5",
      name: "validator #3",
      ipAddress: "9.0.1.2",
      website: "http://www.validator2.com",
      votesAgainst: 0,
    },
  };

  beforeEach(() => {
    ethereumClinet = new EthereumClientServiceMock();
    orbsClientService = new OrbsClientServiceMock();
    orbsPOSDataService = new OrbsPOSDataService(ethereumClinet, orbsClientService);
  });

  describe("getValidators", () => {
    it("should return all the validators addresses", async () => {
      ethereumClinet.withValidators(validatorsMap);
      const actual = await orbsPOSDataService.getValidators();
      const expected = Object.keys(validatorsMap);
      expect(expected).toEqual(actual);
    });
  });
});

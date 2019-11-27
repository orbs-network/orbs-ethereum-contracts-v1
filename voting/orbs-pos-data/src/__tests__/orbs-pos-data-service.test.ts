/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { EthereumClientServiceMock } from "./ethereum-client-service-mock";
import { OrbsClientServiceMock } from "./orbs-client-service-mock";
import { OrbsPOSDataService } from '../OrbsPOSDataService';
import { IValidatorData } from '../interfaces/IValidatorData';
import { IValidatorInfo } from '../interfaces/IValidatorInfo';

describe("Orbs POS data service", () => {
  let ethereumClinet: EthereumClientServiceMock;
  let orbsClientService: OrbsClientServiceMock;
  let orbsPOSDataService: OrbsPOSDataService;

  const validatorsMap: {[key: string]: IValidatorData} = {
    '0x0874BC1383958e2475dF73dC68C4F09658E23777': {
      orbsAddress: "0x8287928a809346dF4Cd53A096025a1136F7C4fF5",
      name: "validator #1",
      ipAddress: "1.2.3.4",
      website: "http://www.validator1.com",
    },
    '0xf257EDE1CE68CA4b94e18eae5CB14942CBfF7D1C': {
      orbsAddress: "0xf7ae622C77D0580f02Bcb2f92380d61e3F6e466c",
      name: "validator #2",
      ipAddress: "5.6.7.8",
      website: "http://www.validator2.com",
    },
    '0xcB6172196BbCf5b4cf9949D7f2e4Ee802EF2b81D': {
      orbsAddress: "0x63AEf7616882F488BCa97361d1c24F05B4657ae5",
      name: "validator #3",
      ipAddress: "9.0.1.2",
      website: "http://www.validator2.com",
    },
  };
  const validatorsAddresses = Object.keys(validatorsMap);

  beforeEach(() => {
    ethereumClinet = new EthereumClientServiceMock();
    orbsClientService = new OrbsClientServiceMock();
    orbsPOSDataService = new OrbsPOSDataService(ethereumClinet, orbsClientService);
  });

  describe("validators", () => {
    it("should return all the validators addresses", async () => {
      ethereumClinet.withValidators(validatorsMap);
      const actual = await orbsPOSDataService.getValidators();
      expect(validatorsAddresses).toEqual(actual);
    });

    it("should return a specific validator's info (With votes against)", async () => {
      ethereumClinet.withValidators(validatorsMap);
      const firstValidatorAddress = validatorsAddresses[0];
      orbsClientService.withValidatorVotes(firstValidatorAddress, 100n);
      orbsClientService.withTotalParticipatingTokens(1_000n);

      const actual = await orbsPOSDataService.getValidatorInfo(firstValidatorAddress);
      const expected: IValidatorInfo = { votesAgainst: 10,...validatorsMap[firstValidatorAddress]}; // 100/1000 = 10%
      expect(expected).toEqual(actual);
    });

    it("should return a specific validator's info (With votes against, but no participating tokens)", async () => {
      ethereumClinet.withValidators(validatorsMap);
      const firstValidatorAddress = validatorsAddresses[0];
      orbsClientService.withValidatorVotes(firstValidatorAddress, 100n);
      orbsClientService.withTotalParticipatingTokens(0n);

      const actual = await orbsPOSDataService.getValidatorInfo(firstValidatorAddress);
      const expected: IValidatorInfo = { votesAgainst: 0,...validatorsMap[firstValidatorAddress]};
      expect(expected).toEqual(actual);
    });

    it("should return a specific validator's info (Without votes against)", async () => {
      ethereumClinet.withValidators(validatorsMap);
      const firstValidatorAddress = validatorsAddresses[0];
      orbsClientService.withValidatorVotes(firstValidatorAddress, 0n);
      orbsClientService.withTotalParticipatingTokens(1_000n);

      const actual = await orbsPOSDataService.getValidatorInfo(firstValidatorAddress);
      const expected: IValidatorInfo = { votesAgainst: 0,...validatorsMap[firstValidatorAddress]};
      expect(expected).toEqual(actual);
    });
  });

  describe("ORBS balance", () => {

    it("should return the ORBS balance of a specific address", async () => {
      const DUMMY_ADDRESS = '0xcB6172196BbCf5b4cf9949D7f2e4Ee802EF2ABC';
      ethereumClinet.withORBSBalance(DUMMY_ADDRESS, 125n);

      const actual = await orbsPOSDataService.getOrbsBalance(DUMMY_ADDRESS);
      expect(actual).toEqual('125');
    });
  });

});

/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { StakingServiceMock } from '../testkit';
import { IStakingService } from '../interfaces/IStakingService';
import { testTxCreatingForServiceMock } from './testUtils/txCreatingMethodTests';

describe(`Staking service mock`, () => {
  testTxCreatingMethods();
  testDataReadingMethods();
});

function testTxCreatingMethods() {
  describe(`Tx creating methods`, () => {
    testTxCreatingForServiceMock(StakingServiceMock, 'stake', serviceMock => serviceMock.stake(1_000_000));
    testTxCreatingForServiceMock(StakingServiceMock, 'unstake', serviceMock => serviceMock.unstake(2_000_000));
    testTxCreatingForServiceMock(StakingServiceMock, 'restake', serviceMock => serviceMock.restake());
    testTxCreatingForServiceMock(StakingServiceMock, 'withdraw', serviceMock => serviceMock.withdraw());
  });
}


function testDataReadingMethods() {
  describe(`Data reading methods`, () => {
    let stakingServiceMock: StakingServiceMock;
    let stakingServiceApi: IStakingService;

    beforeEach(() => {
      stakingServiceMock = new StakingServiceMock(false);
      stakingServiceApi = stakingServiceMock;
    });

    it(`should allow to set and get stake balance`, async () => {
      const beforeResult = await stakingServiceApi.getStakeBalanceOf('DUMMY_ADDRESS');
      expect(beforeResult).toEqual('0');

      stakingServiceMock.withStakeBalance('DUMMY_ADDRESS', '123456');

      const afterResult = await stakingServiceApi.getStakeBalanceOf('DUMMY_ADDRESS');
      expect(afterResult).toEqual('123456');
    });

    it(`should allow to set and get total staked tokens`, async () => {
      const beforeResult = await stakingServiceApi.getTotalStakedTokens();
      expect(beforeResult).toEqual('0');

      stakingServiceMock.withTotalStakedTokens('123456');

      const afterResult = await stakingServiceApi.getTotalStakedTokens();
      expect(afterResult).toEqual('123456');
    });

    it(`should allow to set and get unstake status`, async () => {
      const beforeResult = await stakingServiceApi.getUnstakeStatus('DUMMY_ADDRESS');
      expect(beforeResult).toEqual({ cooldownAmount: 0, cooldownEndTime: 0 });

      stakingServiceMock.withUnstakeStatus('DUMMY_ADDRESS', { cooldownAmount: 123, cooldownEndTime: 456 });

      const afterResult = await stakingServiceMock.getUnstakeStatus('DUMMY_ADDRESS');
      expect(afterResult).toEqual({ cooldownAmount: 123, cooldownEndTime: 456 });
    });

    it(`should allow to set and get contract address`, async () => {
      const newContractAddress = 'NEW_CONTRACT_ADDRESS';

      expect(stakingServiceApi.getStakingContractAddress()).toEqual('DUMMY_CONTRACT_ADDRESS');

      stakingServiceMock.withStakingContractAddress(newContractAddress);

      expect(stakingServiceMock.getStakingContractAddress()).toBe(newContractAddress);
    });
  });
}

/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import 'jest-expect-message';
import { IStakingService } from '../interfaces/IStakingService';
import { StakingServiceMock } from '../testkit';
import { testTxCreatingForServiceMock } from './testUtils/txCreatingMethodTests';

describe(`Staking service mock`, () => {
  testTxCreatingMethods();
  testDataReadingMethodsWithMockHelpers();
  testImitationOfRealContractLogic();
  testImitationOfRealEventsSubscription();
});

function testTxCreatingMethods() {
  describe(`Tx creating methods`, () => {
    testTxCreatingForServiceMock(StakingServiceMock, 'stake', serviceMock => serviceMock.stake(1_000_000n));
    testTxCreatingForServiceMock(StakingServiceMock, 'unstake', serviceMock => serviceMock.unstake(2_000_000n));
    testTxCreatingForServiceMock(StakingServiceMock, 'restake', serviceMock => serviceMock.restake());
    testTxCreatingForServiceMock(StakingServiceMock, 'withdraw', serviceMock => serviceMock.withdraw());
  });
}

// TODO : FUTURE : Add test with multiple owners and check the 'total staked amount'
function testImitationOfRealContractLogic() {
  describe('Data reading methods with real writing API', () => {
    const ownerAddress = '0xowner';
    let stakingService: IStakingService;

    beforeEach(() => {
      stakingService = new StakingServiceMock(true);
      stakingService.setFromAccount(ownerAddress);
    });

    it(`Should allow to set and get stake balance`, async () => {
      const beforeResult = await stakingService.readStakeBalanceOf(ownerAddress);
      expect(beforeResult).toEqual(0n);

      await stakingService.stake(500000n);

      const afterResult = await stakingService.readStakeBalanceOf(ownerAddress);
      expect(afterResult).toEqual(500000n);
    });

    it(`Should return the correct cooldown status after stake, unstake and restake`, async () => {
      const beforeResult = await stakingService.readTotalStakedTokens();
      expect(beforeResult, 'Initial amount should be 0').toEqual(0n);

      // Ensure that one stake updates
      await stakingService.stake(111111n);

      const afterResult = await stakingService.readTotalStakedTokens();
      expect(afterResult, 'Should be equal to staked amount').toEqual(111111n);

      // Ensure several stakes
      await stakingService.stake(222222n);
      await stakingService.stake(333333n);

      const afterSeveralStakesResult = await stakingService.readTotalStakedTokens();
      expect(afterSeveralStakesResult, 'Should be equal to the sum of all previous "stake" orders').toEqual(666666n);

      // Unstake
      await stakingService.unstake(222222n);

      const resultAfterUnstaking = await stakingService.readTotalStakedTokens();
      expect(resultAfterUnstaking, 'Should subtract the unstaked tokens from the total amount').toEqual(444444n);

      // Restake
      await stakingService.restake();
      const resultAfterRestake = await stakingService.readTotalStakedTokens();
      expect(resultAfterRestake, 'Should add all restaked tokens to the total count').toEqual(666666n);
    });

    it(`Should return the correct cooldown status after stake, unstake and restake`, async () => {
      const cooldownReleaseTimestamp = 123456;
      (stakingService as StakingServiceMock).setCooldownReleaseTimestamp(cooldownReleaseTimestamp);

      const beforeResult = await stakingService.readUnstakeStatus(ownerAddress);
      expect(beforeResult).toEqual({ cooldownAmount: 0n, cooldownEndTime: 0 });

      // Stake and unstake to create a cooldown
      await stakingService.stake(5000n);
      await stakingService.unstake(2000n);

      const expectedCooldownTime = cooldownReleaseTimestamp;

      const afterResult = await stakingService.readUnstakeStatus(ownerAddress);
      expect(afterResult).toEqual({ cooldownAmount: 2000n, cooldownEndTime: expectedCooldownTime });

      // Restake (should stake all orbs in cooldown and clear time )
      await stakingService.restake();

      const afterRestakResult = await stakingService.readUnstakeStatus(ownerAddress);
      expect(afterRestakResult, '"Restake" should clear all orbs in cooldown').toEqual({
        cooldownAmount: 0n,
        cooldownEndTime: 0,
      });
    });
  });
}

function testDataReadingMethodsWithMockHelpers() {
  describe(`Data reading methods with mock helpers`, () => {
    let stakingServiceMock: StakingServiceMock;

    beforeEach(() => {
      stakingServiceMock = new StakingServiceMock(false);
    });

    it(`should allow to set and get stake balance`, async () => {
      const beforeResult = await stakingServiceMock.readStakeBalanceOf('DUMMY_ADDRESS');
      expect(beforeResult).toEqual(0n);

      stakingServiceMock.withStakeBalance('DUMMY_ADDRESS', 123_456n);

      const afterResult = await stakingServiceMock.readStakeBalanceOf('DUMMY_ADDRESS');
      expect(afterResult).toEqual(123_456n);
    });

    it(`should allow to set and get total staked tokens`, async () => {
      const beforeResult = await stakingServiceMock.readTotalStakedTokens();
      expect(beforeResult).toEqual(0n);

      stakingServiceMock.withTotalStakedTokens(123_456n);

      const afterResult = await stakingServiceMock.readTotalStakedTokens();
      expect(afterResult).toEqual(123_456n);
    });

    it(`should allow to set and get unstake status`, async () => {
      const beforeResult = await stakingServiceMock.readUnstakeStatus('DUMMY_ADDRESS');
      expect(beforeResult).toEqual({ cooldownAmount: 0n, cooldownEndTime: 0 });

      stakingServiceMock.withUnstakeStatus('DUMMY_ADDRESS', { cooldownAmount: 123n, cooldownEndTime: 456 });

      const afterResult = await stakingServiceMock.readUnstakeStatus('DUMMY_ADDRESS');
      expect(afterResult).toEqual({ cooldownAmount: 123n, cooldownEndTime: 456 });
    });

    it(`should allow to set and get contract address`, async () => {
      const newContractAddress = 'NEW_CONTRACT_ADDRESS';

      expect(stakingServiceMock.getStakingContractAddress()).toEqual('DUMMY_CONTRACT_ADDRESS');

      stakingServiceMock.withStakingContractAddress(newContractAddress);

      expect(stakingServiceMock.getStakingContractAddress()).toBe(newContractAddress);
    });
  });
}

function testImitationOfRealEventsSubscription() {
  describe('RealEvents subscription', () => {
    const ownerAddress = '0xowner';
    let stakingService: IStakingService;
    let callbackSpy: jest.Mock;

    beforeEach(async () => {
      stakingService = new StakingServiceMock();
      stakingService.setFromAccount(ownerAddress);

      // Starting with 1000 staked orbs
      await stakingService.stake(1000n);

      callbackSpy = jest.fn();
    });

    it('Should trigger "Staked" event after staking', async () => {
      stakingService.subscribeToStakedEvent(ownerAddress, callbackSpy);

      await stakingService.stake(100n);

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, 100n, 1100n);
    });

    it('Should trigger "Unstaked" event after unstaking', async () => {
      stakingService.subscribeToUnstakedEvent(ownerAddress, callbackSpy);

      await stakingService.unstake(100n);

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, 100n, 900n);
    });

    it('Should trigger "Restaked" event after restaking', async () => {
      stakingService.subscribeToRestakedEvent(ownerAddress, callbackSpy);

      // Unstake so we could restake
      await stakingService.unstake(400n);

      await stakingService.restake();

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, 400n, 1000n);
    });

    it('Should trigger "Withdrew" event after withdrawing', async () => {
      stakingService.subscribeToWithdrewEvent(ownerAddress, callbackSpy);

      // Unstake so we could withdraw
      await stakingService.unstake(400n);

      await stakingService.withdraw();

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, 400n, 600n);
    });
  });
}

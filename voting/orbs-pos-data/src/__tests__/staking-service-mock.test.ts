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
import 'jest-expect-message';

describe(`Staking service mock`, () => {
  testTxCreatingMethods();
  testDataReadingMethodsWithMockHelpers();
  testImitationOfRealContractLogic();
  testImitationOfRealEventsSubscription();
  testStateSubscription();
});

function testTxCreatingMethods() {
  describe(`Tx creating methods`, () => {
    testTxCreatingForServiceMock(StakingServiceMock, 'stake', serviceMock => serviceMock.stake(1_000_000));
    testTxCreatingForServiceMock(StakingServiceMock, 'unstake', serviceMock => serviceMock.unstake(2_000_000));
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
      expect(beforeResult).toEqual('0');

      await stakingService.stake(500000);

      const afterResult = await stakingService.readStakeBalanceOf(ownerAddress);
      expect(afterResult).toEqual('500000');
    });

    it(`Should return the correct cooldown status after stake, unstake and restake`, async () => {
      const beforeResult = await stakingService.readTotalStakedTokens();
      expect(beforeResult, 'Initial amount should be 0').toEqual('0');

      // Ensure that one stake updates
      await stakingService.stake(111111);

      const afterResult = await stakingService.readTotalStakedTokens();
      expect(afterResult, 'Should be equal to staked amount').toEqual('111111');

      // Ensure several stakes
      await stakingService.stake(222222);
      await stakingService.stake(333333);

      const afterSeveralStakesResult = await stakingService.readTotalStakedTokens();
      expect(afterSeveralStakesResult, 'Should be equal to the sum of all previous "stake" orders').toEqual('666666');

      // Unstake
      await stakingService.unstake(222222);

      const resultAfterUnstaking = await stakingService.readTotalStakedTokens();
      expect(resultAfterUnstaking, 'Should subtract the unstaked tokens from the total amount').toEqual('444444');

      // Restake
      await stakingService.restake();
      const resultAfterRestake = await stakingService.readTotalStakedTokens();
      expect(resultAfterRestake, 'Should add all restaked tokens to the total count').toEqual('666666');
    });

    it(`Should return the correct cooldown status after stake, unstake and restake`, async () => {
      const cooldownReleaseTimestamp = 123456;
      (stakingService as StakingServiceMock).setCooldownReleaseTimestamp(cooldownReleaseTimestamp);

      const beforeResult = await stakingService.readUnstakeStatus(ownerAddress);
      expect(beforeResult).toEqual({ cooldownAmount: 0, cooldownEndTime: 0 });

      // Stake and unstake to create a cooldown
      await stakingService.stake(5000);
      await stakingService.unstake(2000);

      const expectedCooldownTime = cooldownReleaseTimestamp;

      const afterResult = await stakingService.readUnstakeStatus(ownerAddress);
      expect(afterResult).toEqual({ cooldownAmount: 2000, cooldownEndTime: expectedCooldownTime });

      // Restake (should stake all orbs in cooldown and clear time )
      await stakingService.restake();

      const afterRestakResult = await stakingService.readUnstakeStatus(ownerAddress);
      expect(afterRestakResult, '"Restake" should clear all orbs in cooldown').toEqual({
        cooldownAmount: 0,
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
      expect(beforeResult).toEqual('0');

      stakingServiceMock.withStakeBalance('DUMMY_ADDRESS', 123_456);

      const afterResult = await stakingServiceMock.readStakeBalanceOf('DUMMY_ADDRESS');
      expect(afterResult).toEqual('123456');
    });

    it(`should allow to set and get total staked tokens`, async () => {
      const beforeResult = await stakingServiceMock.readTotalStakedTokens();
      expect(beforeResult).toEqual('0');

      stakingServiceMock.withTotalStakedTokens('123456');

      const afterResult = await stakingServiceMock.readTotalStakedTokens();
      expect(afterResult).toEqual('123456');
    });

    it(`should allow to set and get unstake status`, async () => {
      const beforeResult = await stakingServiceMock.readUnstakeStatus('DUMMY_ADDRESS');
      expect(beforeResult).toEqual({ cooldownAmount: 0, cooldownEndTime: 0 });

      stakingServiceMock.withUnstakeStatus('DUMMY_ADDRESS', { cooldownAmount: 123, cooldownEndTime: 456 });

      const afterResult = await stakingServiceMock.readUnstakeStatus('DUMMY_ADDRESS');
      expect(afterResult).toEqual({ cooldownAmount: 123, cooldownEndTime: 456 });
    });

    it(`should allow to set and get contract address`, async () => {
      const newContractAddress = 'NEW_CONTRACT_ADDRESS';

      expect(stakingServiceMock.getStakingContractAddress()).toEqual('DUMMY_CONTRACT_ADDRESS');

      stakingServiceMock.withStakingContractAddress(newContractAddress);

      expect(stakingServiceMock.getStakingContractAddress()).toBe(newContractAddress);
    });
  });
}

function testStateSubscription() {
  describe(`State subscriptions`, () => {
    let stakingService: StakingServiceMock;

    beforeEach(() => {
      stakingService = new StakingServiceMock(false);
    });

    it(`should allow to subscribe and unsubscribe from staking changed event`, async () => {
      const ownerAddress = 'DUMMY_ADDRESS';
      stakingService.setFromAccount(ownerAddress);

      // start with 500,000 staked orbs
      stakingService.withStakeBalance(ownerAddress, 500_000);

      let callbackAmount = 'NOT_CALLED';
      const callback = (error: Error, amount: string) => (callbackAmount = amount);

      const unsubscribe = stakingService.subscribeToStakeAmountChange(ownerAddress, callback);

      // stake 1,000,000 orbs
      const stakePromievent1 = stakingService.stake(1_000_000);
      await stakingService.txsMocker.completeTx(stakePromievent1);

      // make sure that we got the event
      expect(callbackAmount).toEqual('1500000');

      // unstake 100,000 orbs
      const unstakePromievent = stakingService.unstake(100_000);
      await stakingService.txsMocker.completeTx(unstakePromievent);

      // make sure that we got the event
      expect(callbackAmount).toEqual('1400000');

      await unsubscribe();

      // stake another 300,000
      const stakePromievent2 = stakingService.stake(300_000);
      await stakingService.txsMocker.completeTx(stakePromievent2);

      // same as before because the callback is not supposed to run after un-subscribing
      expect(callbackAmount).toEqual('1400000');

      // but balance did change
      const lastBalance = await stakingService.readStakeBalanceOf(ownerAddress);
      expect(lastBalance).toEqual('1700000');
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
      await stakingService.stake(1000);

      callbackSpy = jest.fn();
    });

    it('Should trigger "Staked" event after staking', async () => {
      stakingService.subscribeToStakedEvent(ownerAddress, callbackSpy);

      await stakingService.stake(100);

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, '100', '1100');
    });

    it('Should trigger "Unstaked" event after unstaking', async () => {
      stakingService.subscribeToUnstakedEvent(ownerAddress, callbackSpy);

      await stakingService.unstake(100);

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, '100', '900');
    });

    it('Should trigger "Restaked" event after restaking', async () => {
      stakingService.subscribeToRestakedEvent(ownerAddress, callbackSpy);

      // Unstake so we could restake
      await stakingService.unstake(400);

      await stakingService.restake();

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, '400', '1000');
    });

    it('Should trigger "Withdrew" event after withdrawing', async () => {
      stakingService.subscribeToWithdrewEvent(ownerAddress, callbackSpy);

      // Unstake so we could withdraw
      await stakingService.unstake(400);

      await stakingService.withdraw();

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, '400', '600');
    });
  });
}

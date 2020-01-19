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
  testSubscription();
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
    let stakingService: StakingServiceMock;

    beforeEach(() => {
      stakingService = new StakingServiceMock(false);
    });

    it(`should allow to set and get stake balance`, async () => {
      const beforeResult = await stakingService.getStakeBalanceOf('DUMMY_ADDRESS');
      expect(beforeResult).toEqual('0');

      stakingService.withStakeBalance('DUMMY_ADDRESS', 123_456);

      const afterResult = await stakingService.getStakeBalanceOf('DUMMY_ADDRESS');
      expect(afterResult).toEqual('123456');
    });

    it(`should allow to set and get total staked tokens`, async () => {
      const beforeResult = await stakingService.getTotalStakedTokens();
      expect(beforeResult).toEqual('0');

      stakingService.withTotalStakedTokens('123456');

      const afterResult = await stakingService.getTotalStakedTokens();
      expect(afterResult).toEqual('123456');
    });

    it(`should allow to set and get unstake status`, async () => {
      const beforeResult = await stakingService.getUnstakeStatus('DUMMY_ADDRESS');
      expect(beforeResult).toEqual({ cooldownAmount: 0, cooldownEndTime: 0 });

      stakingService.withUnstakeStatus('DUMMY_ADDRESS', { cooldownAmount: 123, cooldownEndTime: 456 });

      const afterResult = await stakingService.getUnstakeStatus('DUMMY_ADDRESS');
      expect(afterResult).toEqual({ cooldownAmount: 123, cooldownEndTime: 456 });
    });

    it(`should allow to set and get contract address`, async () => {
      const newContractAddress = 'NEW_CONTRACT_ADDRESS';

      expect(stakingService.getStakingContractAddress()).toEqual('DUMMY_CONTRACT_ADDRESS');

      stakingService.withStakingContractAddress(newContractAddress);

      expect(stakingService.getStakingContractAddress()).toBe(newContractAddress);
    });
  });
}

function testSubscription() {
  describe(`Subscriptions`, () => {
    let stakingService: StakingServiceMock;

    beforeEach(() => {
      stakingService = new StakingServiceMock(false);
    });

    it(`should allow to subscribe and unsubscribe from staking changed event`, async () => {
      const ownerAddress = 'DUMMY_ADDRESS';
      stakingService.setFromAccount(ownerAddress);

      // start with 500,000 staked orbs
      stakingService.withStakeBalance(ownerAddress, 500000);

      let callbackMount = 'NOT_CALLED';
      const callback = (error: Error, amount: string) => callbackMount = amount;

      const unsubscribe = stakingService.subscribeToStakeAmountChange(ownerAddress, callback)

      // stake 1,000,000 orbs
      const stakePromievent1 = stakingService.stake(1_000_000);
      await stakingService.txsMocker.completeTx(stakePromievent1);

      // make sure that we got the event
      expect(callbackMount).toEqual('1500000');
  
      // unstake 100,000 orbs
      const unstakePromievent = stakingService.unstake(100_000);
      await stakingService.txsMocker.completeTx(unstakePromievent);

      // make sure that we got the event
      expect(callbackMount).toEqual('1400000');

      await unsubscribe();

      // stake another 300,000
      const stakePromievent2 = stakingService.stake(300_000);
      await stakingService.txsMocker.completeTx(stakePromievent2);
  
      // same as before because we didn't get the callback
      expect(callbackMount).toEqual('1400000'); 

      // but balance did change
      const lastBalance = await stakingService.getStakeBalanceOf(ownerAddress);
      expect(lastBalance).toEqual('1700000');
    });
  });
}

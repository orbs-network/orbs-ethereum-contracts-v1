/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { PromiEvent, TransactionReceipt } from 'web3-core';
import { StakingServiceMock } from '../testkit';
import { IStakingService } from '../interfaces/IStakingService';

describe(`Staking service mock`, () => {
  testWriteMethod('stake', stakingServiceMock => stakingServiceMock.stake(1_000_000));
  testWriteMethod('unstake', stakingServiceMock => stakingServiceMock.unstake(2_000_000));
  testWriteMethod('restake', stakingServiceMock => stakingServiceMock.restake());
  testWriteMethod('withdraw', stakingServiceMock => stakingServiceMock.withdraw());

  testReadMethods();
});

function testWriteMethod(
  methodName: string,
  callMethod: (stakingServiceMock: StakingServiceMock) => PromiEvent<TransactionReceipt>,
) {
  describe(`"${methodName}" internal tests`, () => {
    let stakingServiceMock: StakingServiceMock;

    beforeEach(() => {
      stakingServiceMock = new StakingServiceMock(false);
    });

    it(`should allow to use async await`, async () => {
      stakingServiceMock.setAutoCompleteTxes(true);
      const tr = await callMethod(stakingServiceMock);
      expect(tr.transactionHash.length).toBeGreaterThan(0);
    });

    it(`should allow to reject txes`, () => {
      const promiEvent = callMethod(stakingServiceMock);

      stakingServiceMock.txsMocker.rejectTx(promiEvent, 'DUMMY_ERROR_DESCRIPTION');
      return expect(promiEvent).rejects.toMatch('DUMMY_ERROR_DESCRIPTION');
    });

    it(`should allow to resolve txes`, () => {
      const promiEvent = callMethod(stakingServiceMock);

      stakingServiceMock.txsMocker.resolveTx(promiEvent);
      return expect(promiEvent.then(txReceipt => txReceipt.blockNumber)).resolves.toBeGreaterThan(0);
    });

    it(`should allow to wait for txHash`, () => {
      let actualTxHash: string = null;
      const promiEvent = callMethod(stakingServiceMock).on(`transactionHash`, (txHash: string) => {
        actualTxHash = txHash;
      });

      expect(actualTxHash).toBeNull;
      stakingServiceMock.txsMocker.sendTxHash(promiEvent);
      expect(actualTxHash.length).toBeGreaterThan(0);
    });

    it(`should allow to wait for receipt`, () => {
      let actualTxReceipt: TransactionReceipt = null;
      const promiEvent = callMethod(stakingServiceMock).on(`receipt`, (txReceipt: TransactionReceipt) => {
        actualTxReceipt = txReceipt;
      });

      expect(actualTxReceipt).toBeNull;
      stakingServiceMock.txsMocker.sendTxReceipt(promiEvent);
      expect(actualTxReceipt.blockNumber).toBeGreaterThan(0);
    });

    it(`should allow to get confirmations`, () => {
      let actualConfNumber = 0;
      const promiEvent = callMethod(stakingServiceMock).on(
        `confirmation`,
        (confNumber: number, receipt: TransactionReceipt) => {
          actualConfNumber = confNumber;
        },
      );

      expect(actualConfNumber).toEqual(0);
      stakingServiceMock.txsMocker.sendTxConfirmation(promiEvent, 1);
      expect(actualConfNumber).toEqual(1);
      stakingServiceMock.txsMocker.sendTxConfirmation(promiEvent, 2);
      expect(actualConfNumber).toEqual(2);
      stakingServiceMock.txsMocker.sendTxConfirmation(promiEvent, 3);
      expect(actualConfNumber).toEqual(3);
    });
  });
}

function testReadMethods() {
  describe(`Read methods`, () => {
    let stakingServiceMock: StakingServiceMock;
    let stakingServiceApi: IStakingService;

    beforeEach(() => {
      stakingServiceMock = new StakingServiceMock(false);
      stakingServiceApi = stakingServiceMock;
    });

    it(`should allow to set and get stake balance`, async () => {
      const beforeResult = await stakingServiceApi.getStakeBalanceOf('DUMMY_ADDRESS');
      expect(beforeResult).toEqual('0');

      stakingServiceMock.setStakeBalanceTo('DUMMY_ADDRESS', '123456');

      const afterResult = await stakingServiceApi.getStakeBalanceOf('DUMMY_ADDRESS');
      expect(afterResult).toEqual('123456');
    });

    it(`should allow to set and get total staked tokens`, async () => {
      const beforeResult = await stakingServiceApi.getTotalStakedTokens();
      expect(beforeResult).toEqual('0');

      stakingServiceMock.setTotalStakedTokens('123456');

      const afterResult = await stakingServiceApi.getTotalStakedTokens();
      expect(afterResult).toEqual('123456');
    });

    it(`should allow to set and get unstake status`, async () => {
      const beforeResult = await stakingServiceApi.getUnstakeStatus('DUMMY_ADDRESS');
      expect(beforeResult).toEqual({ cooldownAmount: 0, cooldownEndTime: 0 });

      stakingServiceMock.setUnstakeStatus('DUMMY_ADDRESS', { cooldownAmount: 123, cooldownEndTime: 456 });

      const afterResult = await stakingServiceMock.getUnstakeStatus('DUMMY_ADDRESS');
      expect(afterResult).toEqual({ cooldownAmount: 123, cooldownEndTime: 456 });
    });

    it(`should allow to set and get contract address`, async () => {
      const newContractAddress = 'NEW_CONTRACT_ADDRESS';

      expect(stakingServiceApi.getStakingContractAddress()).toEqual('DUMMY_CONTRACT_ADDRESS');

      stakingServiceMock.setStakingContractAddress(newContractAddress);

      expect(stakingServiceMock.getStakingContractAddress()).toBe(newContractAddress);
    });
  });
}

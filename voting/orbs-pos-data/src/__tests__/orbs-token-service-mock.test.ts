/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { PromiEvent, TransactionReceipt } from 'web3-core';
import { OrbsTokenServiceMock } from '../testkit';
import { IOrbsTokenService } from '../interfaces/IOrbsTokenService';

// TODO : O.L : Maybe make the general 'tx mocking' shared with the 'staking-service-mock.
describe(`Orbs Token service mock`, () => {
  testWriteMethod('approve', orbsTokenServiceMock => orbsTokenServiceMock.approve('spenderAddress', 1_000_000));

  testReadMethods();
});

function testWriteMethod(
  methodName: string,
  callMethod: (orbsTokenServiceMock: OrbsTokenServiceMock) => PromiEvent<TransactionReceipt>,
) {
  describe(`"${methodName}" internal tests`, () => {
    let orbsTokenServiceMock: OrbsTokenServiceMock;

    beforeEach(() => {
      orbsTokenServiceMock = new OrbsTokenServiceMock(false);
    });

    it(`should allow to use async await`, async () => {
      orbsTokenServiceMock.setAutoCompleteTxes(true);
      const tr = await callMethod(orbsTokenServiceMock);
      expect(tr.transactionHash.length).toBeGreaterThan(0);
    });

    it(`should allow to reject txes`, () => {
      const promiEvent = callMethod(orbsTokenServiceMock);

      orbsTokenServiceMock.txsMocker.rejectTx(promiEvent, 'DUMMY_ERROR_DESCRIPTION');
      return expect(promiEvent).rejects.toMatch('DUMMY_ERROR_DESCRIPTION');
    });

    it(`should allow to resolve txes`, () => {
      const promiEvent = callMethod(orbsTokenServiceMock);

      orbsTokenServiceMock.txsMocker.resolveTx(promiEvent);
      return expect(promiEvent.then(txReceipt => txReceipt.blockNumber)).resolves.toBeGreaterThan(0);
    });

    it(`should allow to wait for txHash`, () => {
      let actualTxHash: string = null;
      const promiEvent = callMethod(orbsTokenServiceMock).on(`transactionHash`, (txHash: string) => {
        actualTxHash = txHash;
      });

      expect(actualTxHash).toBeNull;
      orbsTokenServiceMock.txsMocker.sendTxHash(promiEvent);
      expect(actualTxHash.length).toBeGreaterThan(0);
    });

    it(`should allow to wait for receipt`, () => {
      let actualTxReceipt: TransactionReceipt = null;
      const promiEvent = callMethod(orbsTokenServiceMock).on(`receipt`, (txReceipt: TransactionReceipt) => {
        actualTxReceipt = txReceipt;
      });

      expect(actualTxReceipt).toBeNull;
      orbsTokenServiceMock.txsMocker.sendTxReceipt(promiEvent);
      expect(actualTxReceipt.blockNumber).toBeGreaterThan(0);
    });

    it(`should allow to get confirmations`, () => {
      let actualConfNumber = 0;
      const promiEvent = callMethod(orbsTokenServiceMock).on(
        `confirmation`,
        (confNumber: number, receipt: TransactionReceipt) => {
          actualConfNumber = confNumber;
        },
      );

      expect(actualConfNumber).toEqual(0);
      orbsTokenServiceMock.txsMocker.sendTxConfirmation(promiEvent, 1);
      expect(actualConfNumber).toEqual(1);
      orbsTokenServiceMock.txsMocker.sendTxConfirmation(promiEvent, 2);
      expect(actualConfNumber).toEqual(2);
      orbsTokenServiceMock.txsMocker.sendTxConfirmation(promiEvent, 3);
      expect(actualConfNumber).toEqual(3);
    });
  });
}

function testReadMethods() {
  describe(`Read methods`, () => {
    let orbsTokenServiceMock: OrbsTokenServiceMock;
    let orbsTokenServiceApi: IOrbsTokenService;

    beforeEach(() => {
      orbsTokenServiceMock = new OrbsTokenServiceMock(false);
      orbsTokenServiceApi = orbsTokenServiceMock;
    });

    it(`should allow to set and get allowance`, async () => {
      const ownerAddress = 'OWNER_ADDRESS';
      const spenderAddress = 'SPENDER_ADDRESS';
      const allowanceAmount = '2000';

      const valueBefore = await orbsTokenServiceApi.readAllowance(ownerAddress, spenderAddress);
      expect(valueBefore).toEqual('0');

      orbsTokenServiceMock.setAllowance(ownerAddress, spenderAddress, allowanceAmount);

      const valueAfter = await orbsTokenServiceApi.readAllowance(ownerAddress, spenderAddress);
      expect(valueAfter).toEqual(allowanceAmount);
    });
  });
}

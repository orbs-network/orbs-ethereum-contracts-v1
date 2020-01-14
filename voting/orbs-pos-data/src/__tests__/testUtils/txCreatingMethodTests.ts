import { PromiEvent, TransactionReceipt } from 'web3-core';
import { ITxCreatingServiceMock } from '../../testkit/ITxCreatingServiceMock';

interface ITxCreatingServiceMockConstructor<T extends ITxCreatingServiceMock> {
  new (autoComplete: boolean): T;
}

export function testTxCreatingForServiceMock<T extends ITxCreatingServiceMock>(
  serviceMockConstructor: ITxCreatingServiceMockConstructor<T>,
  methodName: string,
  callMethod: (serviceMock: T) => PromiEvent<TransactionReceipt>,
) {
  describe(`"${methodName}" internal tests`, () => {
    let serviceMock: T;

    beforeEach(() => {
      serviceMock = new serviceMockConstructor(false);
      serviceMock.setAutoCompleteTxes(false);
    });

    it(`should allow to use async await`, async () => {
      serviceMock.setAutoCompleteTxes(true);
      const tr = await callMethod(serviceMock);
      expect(tr.transactionHash.length).toBeGreaterThan(0);
    });

    it(`should allow to reject txes`, () => {
      const promiEvent = callMethod(serviceMock);

      serviceMock.txsMocker.rejectTx(promiEvent, 'DUMMY_ERROR_DESCRIPTION');
      return expect(promiEvent).rejects.toMatch('DUMMY_ERROR_DESCRIPTION');
    });

    it(`should allow to resolve txes`, () => {
      const promiEvent = callMethod(serviceMock);

      serviceMock.txsMocker.resolveTx(promiEvent);
      return expect(promiEvent.then(txReceipt => txReceipt.blockNumber)).resolves.toBeGreaterThan(0);
    });

    it(`should allow to wait for txHash`, () => {
      let actualTxHash: string = null;
      const promiEvent = callMethod(serviceMock).on(`transactionHash`, (txHash: string) => {
        actualTxHash = txHash;
      });

      expect(actualTxHash).toBeNull;
      serviceMock.txsMocker.sendTxHash(promiEvent);
      expect(actualTxHash.length).toBeGreaterThan(0);
    });

    it(`should allow to wait for receipt`, () => {
      let actualTxReceipt: TransactionReceipt = null;
      const promiEvent = callMethod(serviceMock).on(`receipt`, (txReceipt: TransactionReceipt) => {
        actualTxReceipt = txReceipt;
      });

      expect(actualTxReceipt).toBeNull;
      serviceMock.txsMocker.sendTxReceipt(promiEvent);
      expect(actualTxReceipt.blockNumber).toBeGreaterThan(0);
    });

    it(`should allow to get confirmations`, () => {
      let actualConfNumber = 0;
      const promiEvent = callMethod(serviceMock).on(
        `confirmation`,
        (confNumber: number, receipt: TransactionReceipt) => {
          actualConfNumber = confNumber;
        },
      );

      expect(actualConfNumber).toEqual(0);
      serviceMock.txsMocker.sendTxConfirmation(promiEvent, 1);
      expect(actualConfNumber).toEqual(1);
      serviceMock.txsMocker.sendTxConfirmation(promiEvent, 2);
      expect(actualConfNumber).toEqual(2);
      serviceMock.txsMocker.sendTxConfirmation(promiEvent, 3);
      expect(actualConfNumber).toEqual(3);
    });
  });
}

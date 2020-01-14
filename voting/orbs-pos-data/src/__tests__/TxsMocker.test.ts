import Web3PromiEvent from 'web3-core-promievent';
import { TxsMocker } from '../testkit/TxsMocker';
import Mock = jest.Mock;
import { testTxCreatingForServiceMock } from './testUtils/txCreatingMethodTests';
import { ITxCreatingServiceMock } from '../testkit/ITxCreatingServiceMock';

type TActionNames = 'ActionA' | 'ActionB';

describe('TxCreatingServiceMock', () => {
  let txsMocker: TxsMocker<TActionNames>;

  beforeEach(() => {
    txsMocker = new TxsMocker(true);
  });

  describe('Construction', () => {
    it('Should assign "autoCompleteTxes" value properly', () => {
      const txMockerAutoCompletingTxes = new TxsMocker(true);
      const txMockerNotAutoCompletingTxes = new TxsMocker(false);

      expect(txMockerAutoCompletingTxes.isAutoCompletingTxes).toBe(true);
      expect(txMockerNotAutoCompletingTxes.isAutoCompletingTxes).toBe(false);
    });
  });

  describe('Event Emitting', () => {
    let handler1: Mock;
    let handler2: Mock;
    let handler3: Mock;
    let handler4: Mock;

    beforeEach(() => {
      handler1 = jest.fn();
      handler2 = jest.fn();
      handler3 = jest.fn();
      handler4 = jest.fn();
    });

    it('Should allow for multiple isolated "register" and "registerOnce"', () => {
      txsMocker.registerToTxCreation('ActionA', handler1);
      txsMocker.registerToNextTxCreation('ActionA', handler2);
      txsMocker.registerToTxCreation('ActionB', handler3);

      // Trigger both events for the first time
      const promiventA1 = Web3PromiEvent();
      const promiventB1 = Web3PromiEvent();
      txsMocker.emmitTxCreated('ActionA', promiventA1);
      txsMocker.emmitTxCreated('ActionB', promiventB1);

      expect(handler1).toBeCalledTimes(1);
      expect(handler1).toBeCalledWith(promiventA1);

      expect(handler2).toBeCalledTimes(1);
      expect(handler2).toBeCalledWith(promiventA1);

      expect(handler3).toBeCalledTimes(1);
      expect(handler3).toBeCalledWith(promiventB1);

      // Trigger both events for the second time
      const promiventA2 = Web3PromiEvent();
      const promiventB2 = Web3PromiEvent();
      txsMocker.emmitTxCreated('ActionA', promiventA2);
      txsMocker.emmitTxCreated('ActionB', promiventB2);

      expect(handler1).toBeCalledTimes(2);
      expect(handler1).toBeCalledWith(promiventA2);

      expect(handler2).toBeCalledTimes(1);
      expect(handler2).not.toBeCalledWith(promiventA2); // Once

      expect(handler3).toBeCalledTimes(2);
      expect(handler3).toBeCalledWith(promiventB2);
    });

    it('Should allow to unregister a single handler', () => {
      txsMocker.registerToTxCreation('ActionA', handler1);
      txsMocker.registerToNextTxCreation('ActionA', handler2);
      txsMocker.registerToTxCreation('ActionB', handler3);
      txsMocker.registerToTxCreation('ActionB', handler4);

      const promiventA1 = Web3PromiEvent();
      const promiventB1 = Web3PromiEvent();

      // Remove only one of the listeners
      txsMocker.unregisterToTxCreation('ActionA', handler2);

      // Trigger events
      txsMocker.emmitTxCreated('ActionA', promiventA1);
      txsMocker.emmitTxCreated('ActionB', promiventB1);

      // Ensure all were called but the removed listener
      expect(handler1).toBeCalledTimes(1);
      expect(handler2).toBeCalledTimes(0);
      expect(handler3).toBeCalledTimes(1);
      expect(handler4).toBeCalledTimes(1);

      expect(handler1).toBeCalledWith(promiventA1);
      expect(handler2).not.toBeCalledWith(promiventA1);
      expect(handler3).toBeCalledWith(promiventB1);
      expect(handler4).toBeCalledWith(promiventB1);
    });

    it('Should allow to unregister all handlers of a specific action', () => {
      txsMocker.registerToTxCreation('ActionA', handler1);
      txsMocker.registerToNextTxCreation('ActionA', handler2);
      txsMocker.registerToTxCreation('ActionB', handler3);
      txsMocker.registerToTxCreation('ActionB', handler4);

      const promiventA1 = Web3PromiEvent();
      const promiventB1 = Web3PromiEvent();

      // Remove only one of the listeners
      txsMocker.removeAllTxCreationListeners('ActionA');

      // Trigger events
      txsMocker.emmitTxCreated('ActionA', promiventA1);
      txsMocker.emmitTxCreated('ActionB', promiventB1);

      // Ensure all were called but the removed listener
      expect(handler1).toBeCalledTimes(0);
      expect(handler2).toBeCalledTimes(0);
      expect(handler3).toBeCalledTimes(1);
      expect(handler4).toBeCalledTimes(1);

      expect(handler1).not.toBeCalledWith(promiventA1);
      expect(handler2).not.toBeCalledWith(promiventA1);
      expect(handler3).toBeCalledWith(promiventB1);
      expect(handler4).toBeCalledWith(promiventB1);
    });

    it('Should allow to unregister all handlers of all actions at once', () => {
      txsMocker.registerToTxCreation('ActionA', handler1);
      txsMocker.registerToNextTxCreation('ActionA', handler2);
      txsMocker.registerToTxCreation('ActionB', handler3);
      txsMocker.registerToTxCreation('ActionB', handler4);

      const promiventA1 = Web3PromiEvent();
      const promiventB1 = Web3PromiEvent();

      // Remove only one of the listeners
      txsMocker.removeAllTxCreationListeners();

      // Trigger events
      txsMocker.emmitTxCreated('ActionA', promiventA1);
      txsMocker.emmitTxCreated('ActionB', promiventB1);

      // Ensure all were called but the removed listener
      expect(handler1).toBeCalledTimes(0);
      expect(handler2).toBeCalledTimes(0);
      expect(handler3).toBeCalledTimes(0);
      expect(handler4).toBeCalledTimes(0);

      expect(handler1).not.toBeCalledWith(promiventA1);
      expect(handler2).not.toBeCalledWith(promiventA1);
      expect(handler3).not.toBeCalledWith(promiventB1);
      expect(handler4).not.toBeCalledWith(promiventB1);
    });
  });

  describe('Tx creating', () => {
    // DEV_NOTE : we are using the generic test for any "tx creating method" to test the txMocker itself.
    class WrapperClassForTxMocker implements ITxCreatingServiceMock {
      public readonly txsMocker: TxsMocker<'demoMethod'>;

      constructor(autoCompleteTx: boolean) {
        this.txsMocker = new TxsMocker<'demoMethod'>(autoCompleteTx);
      }

      createDemoMethod() {
        return this.txsMocker.createTxOf('demoMethod');
      }

      setAutoCompleteTxes(value: boolean): void {
        this.txsMocker.setAutoCompleteTxes(value);
      }
    }

    testTxCreatingForServiceMock(WrapperClassForTxMocker, 'Demo tx creating function', mocker =>
      mocker.createDemoMethod(),
    );
  });

  describe('Tx effect', () => {
    it('Should call the effect lambda when tx is completed', done => {
      const txEffect = jest.fn();

      const txPromievent = txsMocker.createTxOf('ActionA', txEffect);

      txsMocker.completeTx(txPromievent);

      txPromievent.once('transactionHash', () => {
        expect(txEffect).toBeCalledTimes(0);
      });

      txPromievent.once('receipt', () => {
        expect(txEffect).toBeCalledTimes(1);
        done();
      });
    });
  });
});

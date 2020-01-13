import { PromiEvent, TransactionReceipt } from 'web3-core';
import EventEmitter3 from 'eventemitter3';

// TODO : Add tests for event registration for implementing classes (smth generic for all extenders of this class)
export class TxsMocker<T extends string> {
  private txCreationEventEmitter = new EventEmitter3();

  public registerToTxCreation(
    txCreationActionName: T,
    txCreationHandler: (promievent: PromiEvent<TransactionReceipt>) => void,
  ): void {
    this.txCreationEventEmitter.on(txCreationActionName, txCreationHandler);
  }

  public registerToNextTxCreation(
    txCreationActionName: T,
    txCreationHandler: (promievent: PromiEvent<TransactionReceipt>) => void,
  ): void {
    this.txCreationEventEmitter.once(txCreationActionName, txCreationHandler);
  }

  public unregisterToTxCreation(
    txCreationActionName: T,
    txCreationHandler: (promievent: PromiEvent<TransactionReceipt>) => void,
  ): void {
    this.txCreationEventEmitter.removeListener(txCreationActionName, txCreationHandler);
  }

  public removeAllTxCreationListeners(txCreationActionName?: T) {
    this.txCreationEventEmitter.removeAllListeners(txCreationActionName);
  }

  public emmitTxCreated(txCreationActionName: T, promievent: PromiEvent<TransactionReceipt>) {
    this.txCreationEventEmitter.emit(txCreationActionName, promievent);
  }
}

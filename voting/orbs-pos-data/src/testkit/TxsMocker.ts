import { PromiEvent, TransactionReceipt } from 'web3-core';
import EventEmitter3 from 'eventemitter3';
import Web3PromiEvent from 'web3-core-promievent';
import { IStakingService } from '../interfaces/IStakingService';

interface ITxData {
  promiEvent: PromiEvent<TransactionReceipt> & {
    resolve: (txReceipt: TransactionReceipt) => void;
    reject: (reason: string) => void;
  };
  txReceipt: TransactionReceipt;
}

export class TxsMocker<T extends string> {
  private senderAccountAddress: string = 'DUMMY_FROM_ADDRESS';

  private txCreationEventEmitter = new EventEmitter3();

  private txPromieventToEffect: Map<object, () => void> = new Map();
  private txDataMap: Map<object, ITxData> = new Map();

  constructor(private autoCompleteTxes: boolean) {}

  // ****************************
  // Txs config
  // ****************************
  public setFromAccount(address: string) {
    this.senderAccountAddress = address;
  }

  public getFromAccount(): string {
    return this.senderAccountAddress;
  }

  public get isAutoCompletingTxes(): boolean {
    return this.autoCompleteTxes;
  }

  public setAutoCompleteTxes(autoCompleteTxes: boolean) {
    this.autoCompleteTxes = autoCompleteTxes;
  }

  // ****************************
  // Txs creation events emitting
  // ****************************
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

  // ****************************
  // Txs test utils
  // ****************************
  public createTxOf(actionName: T, effect?: () => void): PromiEvent<TransactionReceipt> {
    const promievent = this.generateTxData();

    this.handleTxCreated(actionName, promievent, effect);

    return promievent;
  }

  public completeTx(eventEmitter: any): void {
    setTimeout(() => {
      this.sendTxHash(eventEmitter);
      this.performTxEffect(eventEmitter); // NOTE : To mock the real world, all effects should take effect by the time the receipt is created.
      this.sendTxReceipt(eventEmitter);
      this.sendTxConfirmation(eventEmitter, 1);
      this.resolveTx(eventEmitter);
    }, 1);
  }

  public sendTxHash(eventEmitter: any): void {
    const { promiEvent, txReceipt } = this.getTxDataByEventEmitter(eventEmitter);
    eventEmitter.emit('transactionHash', txReceipt.transactionHash);
  }

  public sendTxReceipt(eventEmitter: any): void {
    const { promiEvent, txReceipt } = this.getTxDataByEventEmitter(eventEmitter);
    eventEmitter.emit('receipt', txReceipt);
  }

  public sendTxConfirmation(eventEmitter: any, confNumber: number): void {
    const { promiEvent, txReceipt } = this.getTxDataByEventEmitter(eventEmitter);
    eventEmitter.emit('confirmation', confNumber, txReceipt);
  }

  public resolveTx(eventEmitter: any): void {
    const { promiEvent, txReceipt } = this.getTxDataByEventEmitter(eventEmitter);
    promiEvent.resolve(txReceipt);
  }

  public rejectTx(eventEmitter: any, error: string): void {
    const { promiEvent, txReceipt } = this.getTxDataByEventEmitter(eventEmitter);
    promiEvent.reject(error);
  }

  private handleTxCreated(actionName: T, promievent: PromiEvent<TransactionReceipt>, effect?: () => void) {
    if (effect) {
      this.txPromieventToEffect.set(promievent, effect);
    }

    if (this.autoCompleteTxes) {
      this.completeTx(promievent);
    }

    this.emmitTxCreated(actionName, promievent);
  }

  private generateTxData(): PromiEvent<TransactionReceipt> {
    const promiEvent: any = Web3PromiEvent();
    const txReceipt = this.generateRandomTxReceipt();
    this.txDataMap.set(promiEvent.eventEmitter, { promiEvent, txReceipt });
    return promiEvent.eventEmitter;
  }

  private generateRandomTxReceipt(): TransactionReceipt {
    return {
      status: true,
      transactionHash: `DUMMY_transactionHash_${Math.floor(Math.random() * 1000000)}`,
      transactionIndex: 1000000,
      blockHash: 'DUMMY_blockHash',
      blockNumber: 2000000,
      from: this.senderAccountAddress,
      to: 'DUMMY_TO_ADDRESS',
      contractAddress: 'DUMMY_CONTRACT_ADDRESS',
      cumulativeGasUsed: 222,
      gasUsed: 111,
      logs: [],
      logsBloom: 'DUMMY_logsBloom',
    };
  }

  private performTxEffect(eventEmmiter: any): void {
    if (this.txPromieventToEffect.has(eventEmmiter)) {
      const effect = this.txPromieventToEffect.get(eventEmmiter);

      effect();

      this.txPromieventToEffect.delete(eventEmmiter);
    }
  }

  private getTxDataByEventEmitter(eventEmitter: any): ITxData {
    return this.txDataMap.get(eventEmitter);
  }
}

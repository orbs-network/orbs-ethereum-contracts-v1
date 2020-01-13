import { PromiEvent, TransactionReceipt } from 'web3-core';
import Web3PromiEvent from 'web3-core-promievent';
import { IOrbsTokenService } from '../interfaces/IOrbsTokenService';
import { TxCreatingServiceMockBase } from './TxCreatingServiceMockBase';

export type OrbsAllowanceChangeCallback = (error: Error, allowance: string) => void;

type TTxCreatingActionNames = 'approve';

interface ITxData {
  promiEvent: PromiEvent<TransactionReceipt> & {
    resolve: (txReceipt: TransactionReceipt) => void;
    reject: (reason: string) => void;
  };
  txReceipt: TransactionReceipt;
}

export class OrbsTokenServiceMock extends TxCreatingServiceMockBase<TTxCreatingActionNames>
  implements IOrbsTokenService {
  private txDataMap: Map<object, ITxData> = new Map();
  private txPromieventToEffect: Map<object, () => void> = new Map();
  private addressToAllowancesMap: Map<string, Map<string, string>> = new Map();
  private allowanceChangeEventsMap: Map<string, Map<string, Map<number, OrbsAllowanceChangeCallback>>> = new Map<
    string,
    Map<string, Map<number, OrbsAllowanceChangeCallback>>
  >();

  private senderAccountAddress: string = 'DUMMY_FROM_ADDRESS';

  constructor(public autoCompleteTxes: boolean = true) {
    super();
  }

  // CONFIG //
  setFromAccount(address: string): IOrbsTokenService {
    this.senderAccountAddress = address;
    return this;
  }

  // WRITE (TX creation) //
  approve(spenderAddress: string, amount: number): PromiEvent<TransactionReceipt> {
    const promievent = this.generateTxData();

    const txEffect = () => this.setAllowance(this.senderAccountAddress, spenderAddress, amount.toString());

    this.handleTxCreated('approve', promievent, txEffect);

    return promievent;
  }

  // SUBSCRIPTION //
  subscribeToAllowanceChange(
    ownerAddress: string,
    spenderAddress: string,
    callback: (error: Error, allowance: string) => void,
  ) {
    // Ensure we have a mapping for the given owner
    if (!this.allowanceChangeEventsMap.has(ownerAddress)) {
      this.allowanceChangeEventsMap.set(ownerAddress, new Map<string, Map<number, OrbsAllowanceChangeCallback>>());
    }

    // Ensure we have a mapping for the given spender
    const ownerToSpenderAllowanceSubscriptionMap = this.allowanceChangeEventsMap.get(ownerAddress);
    if (!ownerToSpenderAllowanceSubscriptionMap.has(spenderAddress)) {
      ownerToSpenderAllowanceSubscriptionMap.set(spenderAddress, new Map<number, OrbsAllowanceChangeCallback>());
    }

    const subscriptionsMap = ownerToSpenderAllowanceSubscriptionMap.get(spenderAddress);

    // Generate id and add the event handler
    const eventTransmitterId = Date.now() + Math.random() * 10;

    subscriptionsMap.set(eventTransmitterId, callback);

    return () => {
      this.allowanceChangeEventsMap
        .get(ownerAddress)
        .get(spenderAddress)
        .delete(eventTransmitterId);
    };
  }
  // READ //
  async readAllowance(ownerAddress: string, spenderAddress: string): Promise<string> {
    // default allowance
    let allowance = '0';

    if (this.addressToAllowancesMap.has(ownerAddress)) {
      const ownerAllowances = this.addressToAllowancesMap.get(ownerAddress);

      if (ownerAllowances.has(spenderAddress)) {
        allowance = ownerAllowances.get(spenderAddress);
      }
    }

    return allowance;
  }

  private generateTxData(): PromiEvent<TransactionReceipt> {
    const promiEvent: any = Web3PromiEvent();
    const txReceipt = this.generateRandomTxReceipt();
    this.txDataMap.set(promiEvent.eventEmitter, { promiEvent, txReceipt });
    return promiEvent.eventEmitter;
  }

  private getTxDataByEventEmitter(eventEmitter: any): ITxData {
    return this.txDataMap.get(eventEmitter);
  }

  // TODO : O.L : FUTURE : Check if all Tx test function can be merged ('StakingServiceMock' has same functions)
  // TX Test Utils //
  private handleTxCreated(
    actionName: TTxCreatingActionNames,
    promievent: PromiEvent<TransactionReceipt>,
    effect?: () => void,
  ) {
    if (effect) {
      this.txPromieventToEffect.set(promievent, effect);
    }

    if (this.autoCompleteTxes) {
      this.completeTx(promievent);
    }

    this.emmitTxCreated(actionName, promievent);
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

  public completeTx(eventEmitter: any): void {
    setTimeout(() => {
      this.sendTxHash(eventEmitter);
      this.performTxEffect(eventEmitter); // NOTE : To mock the real world, all effects should take effect by the time the receipt is created.
      this.sendTxReceipt(eventEmitter);
      this.sendTxConfirmation(eventEmitter, 1);
      this.resolveTx(eventEmitter);
    }, 1);
  }

  private performTxEffect(eventEmmiter: any): void {
    if (this.txPromieventToEffect.has(eventEmmiter)) {
      const effect = this.txPromieventToEffect.get(eventEmmiter);

      effect();

      this.txPromieventToEffect.delete(eventEmmiter);
    }
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

  // State test utils //
  setAllowance(ownerAddress: string, spenderAddress: string, allowanceSum: string) {
    if (!this.addressToAllowancesMap.has(ownerAddress)) {
      this.addressToAllowancesMap.set(ownerAddress, new Map<string, string>());
    }

    const ownerAllowances = this.addressToAllowancesMap.get(ownerAddress);

    ownerAllowances.set(spenderAddress, allowanceSum);

    // Trigger listeners
    this.triggerAllowanceChangeCallbacks(ownerAddress, spenderAddress);
  }

  // Subscription triggering
  private triggerAllowanceChangeCallbacks(ownerAddress: string, spenderAddress: string) {
    const newAllowance = this.addressToAllowancesMap.get(ownerAddress).get(spenderAddress);

    if (
      this.allowanceChangeEventsMap.has(ownerAddress) &&
      this.allowanceChangeEventsMap.get(ownerAddress).has(spenderAddress)
    ) {
      const callbacks = this.allowanceChangeEventsMap
        .get(ownerAddress)
        .get(spenderAddress)
        .values();

      for (let callback of callbacks) {
        callback(null, `${newAllowance}`);
      }
    }
  }
}

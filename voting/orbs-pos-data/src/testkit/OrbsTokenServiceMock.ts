import { PromiEvent, TransactionReceipt } from 'web3-core';
import Web3PromiEvent from 'web3-core-promievent';
import { IOrbsTokenService } from '../interfaces/IOrbsTokenService';

export type OrbsAllowanceChangeCallback = (error: Error, allowance: string) => void;

interface ITxData {
  promiEvent: PromiEvent<TransactionReceipt> & {
    resolve: (txReceipt: TransactionReceipt) => void;
    reject: (reason: string) => void;
  };
  txReceipt: TransactionReceipt;
}

export class OrbsTokenServiceMock implements IOrbsTokenService {
  private txDataMap: Map<object, ITxData> = new Map();
  private addressToAllowancesMap: Map<string, Map<string, string>> = new Map();
  private allowanceChangeEventsMap: Map<string, Map<string, Map<number, OrbsAllowanceChangeCallback>>> = new Map<
    string,
    Map<string, Map<number, OrbsAllowanceChangeCallback>>
  >();

  private senderAccountAddress: string = 'DUMMY_FROM_ADDRESS';

  constructor(public autoCompleteTxes: boolean = true) {}

  // CONFIG //
  setFromAccount(address: string): IOrbsTokenService {
    this.senderAccountAddress = address;
    return this;
  }

  // WRITE //
  approve(spenderAddress: string, amount: number): PromiEvent<TransactionReceipt> {
    const promitEvent = this.generateTxData();
    if (this.autoCompleteTxes) {
      this.completeTx(promitEvent);
      // TODO : O.L : Check if this is the best place to put this effect
      this.setAllowance(this.senderAccountAddress, spenderAddress, amount.toString());
    }
    return promitEvent;
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
  async getAllowance(ownerAddress: string, spenderAddress: string): Promise<string> {
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

  // TX Test Utils //
  // TODO : O.L : FUTURE : Check if all Tx test function can be merged ('StakingServiceMock' has same functions)
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
      this.sendTxReceipt(eventEmitter);
      this.sendTxConfirmation(eventEmitter, 1);
      this.resolveTx(eventEmitter);
    }, 1);
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

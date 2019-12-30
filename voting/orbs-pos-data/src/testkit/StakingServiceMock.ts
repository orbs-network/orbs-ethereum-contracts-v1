import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IStakingService, IStakingStatus } from '../interfaces/IStakingService';
import Web3PromiEvent from 'web3-core-promievent';

interface ITxData {
  promiEvent: PromiEvent<TransactionReceipt> & {
    resolve: (txReceipt: TransactionReceipt) => void;
    reject: (reason: string) => void;
  };
  txReceipt: TransactionReceipt;
}

export class StakingServiceMock implements IStakingService {
  private txDataMap: Map<object, ITxData> = new Map();
  private addressToBalanceMap: Map<string, string> = new Map();
  private addressToStakeStatus: Map<string, IStakingStatus> = new Map();
  private totalStakedTokens: string = '0';

  private senderAccountAddress: string = 'DUMMY_FROM_ADDRESS';

  constructor(public autoCompleteTxes: boolean = true) {}

  // CONFIG //
  setFromAccount(address: string): IStakingService {
    this.senderAccountAddress = address;
    return this;
  }

  // WRITE //
  stake(amount: number): PromiEvent<TransactionReceipt> {
    const promitEvent = this.generateTxData();
    if (this.autoCompleteTxes) {
      this.completeTx(promitEvent);
    }
    return promitEvent;
  }

  unstake(amount: number): PromiEvent<TransactionReceipt> {
    const promitEvent = this.generateTxData();
    if (this.autoCompleteTxes) {
      this.completeTx(promitEvent);
    }
    return promitEvent;
  }

  restake(): PromiEvent<TransactionReceipt> {
    const promitEvent = this.generateTxData();
    if (this.autoCompleteTxes) {
      this.completeTx(promitEvent);
    }
    return promitEvent;
  }

  withdraw(): PromiEvent<TransactionReceipt> {
    const promitEvent = this.generateTxData();
    if (this.autoCompleteTxes) {
      this.completeTx(promitEvent);
    }
    return promitEvent;
  }

  // READ //
  async getStakeBalanceOf(stakeOwner: string): Promise<string> {
    const amount = this.addressToBalanceMap.get(stakeOwner);
    return amount ? amount : '0';
  }

  async getTotalStakedTokens(): Promise<string> {
    return this.totalStakedTokens;
  }

  async getUnstakeStatus(stakeOwner: string): Promise<IStakingStatus> {
    const status = this.addressToStakeStatus.get(stakeOwner);
    return status ? status : { cooldownAmount: 0, cooldownEndTime: 0 };
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

  // Test Utils //
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

  public setStakeBalanceTo(address: string, amount: string) {
    this.addressToBalanceMap.set(address, amount);
  }

  public setTotalStakedTokens(amount: string) {
    this.totalStakedTokens = amount;
  }

  public setUnstakeStatus(address: string, status: IStakingStatus) {
    this.addressToStakeStatus.set(address, status);
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
}

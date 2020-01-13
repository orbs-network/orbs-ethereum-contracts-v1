import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IStakingService, IStakingStatus } from '../interfaces/IStakingService';
import Web3PromiEvent from 'web3-core-promievent';
import { TxCreatingServiceMockBase } from './TxCreatingServiceMockBase';

type TTxCreatingActionNames = 'stake' | 'unstake' | 'restake' | 'withdraw';

interface ITxData {
  promiEvent: PromiEvent<TransactionReceipt> & {
    resolve: (txReceipt: TransactionReceipt) => void;
    reject: (reason: string) => void;
  };
  txReceipt: TransactionReceipt;
}

export class StakingServiceMock extends TxCreatingServiceMockBase<TTxCreatingActionNames> implements IStakingService {
  private stakingContractAddress: string = 'DUMMY_CONTRACT_ADDRESS';
  private txDataMap: Map<object, ITxData> = new Map();
  private txPromieventToEffect: Map<object, () => void> = new Map();
  private addressToBalanceMap: Map<string, string> = new Map();
  private addressToStakeStatus: Map<string, IStakingStatus> = new Map();
  private totalStakedTokens: string = '0';

  private senderAccountAddress: string = 'DUMMY_FROM_ADDRESS';

  constructor(public autoCompleteTxes: boolean = true) {
    super();
  }

  // CONFIG //
  setFromAccount(address: string): IStakingService {
    this.senderAccountAddress = address;
    return this;
  }

  // WRITE (TX creation) //
  stake(amount: number): PromiEvent<TransactionReceipt> {
    const promievent = this.generateTxData();

    this.handleTxCreated('stake', promievent);

    return promievent;
  }

  unstake(amount: number): PromiEvent<TransactionReceipt> {
    const promievent = this.generateTxData();

    this.handleTxCreated('unstake', promievent);

    return promievent;
  }

  restake(): PromiEvent<TransactionReceipt> {
    const promievent = this.generateTxData();

    this.handleTxCreated('restake', promievent);

    return promievent;
  }

  withdraw(): PromiEvent<TransactionReceipt> {
    const promievent = this.generateTxData();

    this.handleTxCreated('withdraw', promievent);

    return promievent;
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

  public setStakeBalanceTo(address: string, amount: string) {
    this.addressToBalanceMap.set(address, amount);
  }

  public setTotalStakedTokens(amount: string) {
    this.totalStakedTokens = amount;
  }

  public setUnstakeStatus(address: string, status: IStakingStatus) {
    this.addressToStakeStatus.set(address, status);
  }

  public setStakingContractAddress(address: string) {
    this.stakingContractAddress = address;
  }

  public getStakingContractAddress(): string {
    return this.stakingContractAddress;
  }

  private performTxEffect(eventEmitter: any): void {
    if (this.txPromieventToEffect.has(eventEmitter)) {
      const effect = this.txPromieventToEffect.get(eventEmitter);

      effect();

      this.txPromieventToEffect.delete(eventEmitter);
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
}

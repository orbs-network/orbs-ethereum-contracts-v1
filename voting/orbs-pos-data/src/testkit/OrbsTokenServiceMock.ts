import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IStakingStatus } from '../interfaces/IStakingService';
import Web3PromiEvent from 'web3-core-promievent';
import { IOrbsTokenService } from '../interfaces/IOrbsTokenService';

interface ITxData {
  promiEvent: PromiEvent<TransactionReceipt> & {
    resolve: (txReceipt: TransactionReceipt) => void;
    reject: (reason: string) => void;
  };
  txReceipt: TransactionReceipt;
}

export class OrbsTokenServiceMock implements IOrbsTokenService {
  private txDataMap: Map<object, ITxData> = new Map();
  private addressToBalanceMap: Map<string, string> = new Map();
  private addressToAllowancesMap: Map<string, Map<string, string>> = new Map();

  private senderAccountAddress: string = 'DUMMY_FROM_ADDRESS';

  constructor(public autoCompleteTxes: boolean = true) {}

  // CONFIG //
  setFromAccount(address: string): IOrbsTokenService {
    this.senderAccountAddress = address;
    return this;
  }

  // WRITE //
  approve(amount: number): PromiEvent<TransactionReceipt> {
    const promitEvent = this.generateTxData();
    if (this.autoCompleteTxes) {
      this.completeTx(promitEvent);
    }
    return promitEvent;
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
  }
}

import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IStakingService, IStakingStatus, StakeAmountChangeCallback } from '../interfaces/IStakingService';
import { TxsMocker } from './TxsMocker';
import { ITxCreatingServiceMock } from './ITxCreatingServiceMock';

type TTxCreatingActionNames = 'stake' | 'unstake' | 'restake' | 'withdraw';

export class StakingServiceMock implements IStakingService, ITxCreatingServiceMock {
  public readonly txsMocker: TxsMocker<TTxCreatingActionNames>;

  private stakingContractAddress: string = 'DUMMY_CONTRACT_ADDRESS';
  private addressToBalanceMap: Map<string, number> = new Map();
  private addressToStakeStatus: Map<string, IStakingStatus> = new Map();
  private stakeAmountChangeEventsMap: Map<string, StakeAmountChangeCallback> = new Map();
  private totalStakedTokens: string = '0';

  constructor(autoCompleteTxes: boolean = true) {
    this.txsMocker = new TxsMocker<TTxCreatingActionNames>(autoCompleteTxes);
  }

  // CONFIG //
  setFromAccount(address: string): void {
    this.txsMocker.setFromAccount(address);
  }

  // WRITE (TX creation) //
  stake(amount: number): PromiEvent<TransactionReceipt> {
    const txEffect = () => {
      const currentBalance = this.addressToBalanceMap.get(this.txsMocker.getFromAccount()) || 0;
      const newBalance = currentBalance + amount;
      this.addressToBalanceMap.set(this.txsMocker.getFromAccount(), newBalance);
      for (let callback of this.stakeAmountChangeEventsMap.values()) {
        callback(null, newBalance.toString());
      }
    }
    return this.txsMocker.createTxOf('stake', txEffect);
  }

  unstake(amount: number): PromiEvent<TransactionReceipt> {
    const txEffect = () => {
      const currentBalance = this.addressToBalanceMap.get(this.txsMocker.getFromAccount()) || 0;
      const newBalance = currentBalance - amount;
      this.addressToBalanceMap.set(this.txsMocker.getFromAccount(), newBalance);
      for (let callback of this.stakeAmountChangeEventsMap.values()) {
        callback(null, newBalance.toString());
      }
    }
    return this.txsMocker.createTxOf('unstake', txEffect);
  }

  restake(): PromiEvent<TransactionReceipt> {
    return this.txsMocker.createTxOf('restake');
  }

  withdraw(): PromiEvent<TransactionReceipt> {
    return this.txsMocker.createTxOf('withdraw');
  }

  // READ //
  async getStakeBalanceOf(stakeOwner: string): Promise<string> {
    const amount = this.addressToBalanceMap.get(stakeOwner);
    return amount ? amount.toString() : '0';
  }

  async getTotalStakedTokens(): Promise<string> {
    return this.totalStakedTokens;
  }

  async getUnstakeStatus(stakeOwner: string): Promise<IStakingStatus> {
    const status = this.addressToStakeStatus.get(stakeOwner);
    return status ? status : { cooldownAmount: 0, cooldownEndTime: 0 };
  }

  public getStakingContractAddress(): string {
    return this.stakingContractAddress;
  }

  // SUBSCRIPTIONS //
  subscribeToStakeAmountChange(
    stakeOwner: string,
    callback: StakeAmountChangeCallback,
  ): () => Promise<boolean> {
    this.stakeAmountChangeEventsMap.set(stakeOwner, callback);
    return () => {
      this.stakeAmountChangeEventsMap.delete(stakeOwner);
      return Promise.resolve(true)
    };
  }

  // Test Utils //

  public withStakeBalance(address: string, amount: number) {
    this.addressToBalanceMap.set(address, amount);
  }

  public withTotalStakedTokens(amount: string) {
    this.totalStakedTokens = amount;
  }

  public withUnstakeStatus(address: string, status: IStakingStatus) {
    this.addressToStakeStatus.set(address, status);
  }

  public withStakingContractAddress(address: string) {
    this.stakingContractAddress = address;
  }
}

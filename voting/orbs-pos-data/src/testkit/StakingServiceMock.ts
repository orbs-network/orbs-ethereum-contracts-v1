import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IStakingService, IStakingStatus } from '../interfaces/IStakingService';
import { TxsMocker } from './TxsMocker';
import { ITxCreatingServiceMock } from './ITxCreatingServiceMock';

type TTxCreatingActionNames = 'stake' | 'unstake' | 'restake' | 'withdraw';

export class StakingServiceMock implements IStakingService, ITxCreatingServiceMock {
  public readonly txsMocker: TxsMocker<TTxCreatingActionNames>;

  private stakingContractAddress: string = 'DUMMY_CONTRACT_ADDRESS';
  private addressToBalanceMap: Map<string, string> = new Map();
  private addressToStakeStatus: Map<string, IStakingStatus> = new Map();
  private totalStakedTokens: string = '0';

  constructor(autoCompleteTxes: boolean = true) {
    this.txsMocker = new TxsMocker<TTxCreatingActionNames>(autoCompleteTxes);
  }

  // CONFIG //
  setFromAccount(address: string): IStakingService {
    this.txsMocker.setFromAccount(address);
    return this;
  }

  // WRITE (TX creation) //
  stake(amount: number): PromiEvent<TransactionReceipt> {
    return this.txsMocker.createTxOf('stake');
  }

  unstake(amount: number): PromiEvent<TransactionReceipt> {
    return this.txsMocker.createTxOf('unstake');
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
    return amount ? amount : '0';
  }

  async getTotalStakedTokens(): Promise<string> {
    return this.totalStakedTokens;
  }

  async getUnstakeStatus(stakeOwner: string): Promise<IStakingStatus> {
    const status = this.addressToStakeStatus.get(stakeOwner);
    return status ? status : { cooldownAmount: 0, cooldownEndTime: 0 };
  }

  // Test Utils //

  public setAutoCompleteTxes(autoCompleteTxes: boolean) {
    this.txsMocker.setAutoCompleteTxes(autoCompleteTxes);
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
}

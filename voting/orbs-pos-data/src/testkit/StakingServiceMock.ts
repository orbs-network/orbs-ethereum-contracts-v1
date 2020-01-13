import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IStakingService, IStakingStatus } from '../interfaces/IStakingService';
import { TxsMocker } from './TxsMocker';

type TTxCreatingActionNames = 'stake' | 'unstake' | 'restake' | 'withdraw';

export class StakingServiceMock implements IStakingService {
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

  setAutoCompleteTxes(autoCompleteTxes: boolean) {
    this.txsMocker.setAutoCompleteTxes(autoCompleteTxes);
  }

  // WRITE (TX creation) //
  stake(amount: number): PromiEvent<TransactionReceipt> {
    const promievent = this.txsMocker.generateTxData();

    this.txsMocker.handleTxCreated('stake', promievent);

    return promievent;
  }

  unstake(amount: number): PromiEvent<TransactionReceipt> {
    const promievent = this.txsMocker.generateTxData();

    this.txsMocker.handleTxCreated('unstake', promievent);

    return promievent;
  }

  restake(): PromiEvent<TransactionReceipt> {
    const promievent = this.txsMocker.generateTxData();

    this.txsMocker.handleTxCreated('restake', promievent);

    return promievent;
  }

  withdraw(): PromiEvent<TransactionReceipt> {
    const promievent = this.txsMocker.generateTxData();

    this.txsMocker.handleTxCreated('withdraw', promievent);

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

  // Test Utils //

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

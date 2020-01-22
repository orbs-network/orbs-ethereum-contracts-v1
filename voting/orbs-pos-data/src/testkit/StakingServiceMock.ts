import { PromiEvent, TransactionReceipt } from 'web3-core';
import {
  IStakingService,
  IStakingStatus,
  StakeAmountChangeCallback,
  StakingServiceEventCallback,
} from '../interfaces/IStakingService';
import { TxsMocker } from './TxsMocker';
import { ITxCreatingServiceMock } from './ITxCreatingServiceMock';
import { TUnsubscribeFunction } from '../services/contractsTypes/contractTypes';
import {
  callAllEventCallbacks,
  ensureAndGetInnerMap,
  setValueWithUniqueIdAndUnsubscribeFunction,
} from './testKitHelpers';
import { CANCELLED } from 'dns';

type TTxCreatingActionNames = 'stake' | 'unstake' | 'restake' | 'withdraw';

export class StakingServiceMock implements IStakingService, ITxCreatingServiceMock {
  public readonly txsMocker: TxsMocker<TTxCreatingActionNames>;

  private stakingContractAddress: string = 'DUMMY_CONTRACT_ADDRESS';
  private addressToTotalStakedAmountMap: Map<string, number> = new Map();
  private addressToStakeStatus: Map<string, IStakingStatus> = new Map();
  private totalStakedTokens: string = '0';

  private stakedEventsMap: Map<string, Map<number, StakingServiceEventCallback>>;
  private restakedEventsMap: Map<string, Map<number, StakingServiceEventCallback>>;
  private unstakedEventsMap: Map<string, Map<number, StakingServiceEventCallback>>;
  private withdrewEventsMap: Map<string, Map<number, StakingServiceEventCallback>>;

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
      const stakeOwner = this.txsMocker.getFromAccount();
      const currentStakedAmount = this.addressToTotalStakedAmountMap.get(stakeOwner) || 0;
      const totalStakedAmount = currentStakedAmount + amount;

      this.triggerStakedEvent(stakeOwner, amount.toString(), totalStakedAmount.toString());
    };
    return this.txsMocker.createTxOf('stake', txEffect);
  }

  unstake(amount: number): PromiEvent<TransactionReceipt> {
    const txEffect = () => {
      const stakeOwner = this.txsMocker.getFromAccount();
      const currentStakedAmount = this.addressToTotalStakedAmountMap.get(stakeOwner) || 0;
      const totalStakedAmount = currentStakedAmount - amount;

      this.triggerUnstakedEvent(stakeOwner, amount.toString(), totalStakedAmount.toString());
    };
    return this.txsMocker.createTxOf('unstake', txEffect);
  }

  restake(): PromiEvent<TransactionReceipt> {
    return this.txsMocker.createTxOf('restake');
  }

  withdraw(): PromiEvent<TransactionReceipt> {
    return this.txsMocker.createTxOf('withdraw');
  }

  // READ //
  async readStakeBalanceOf(stakeOwner: string): Promise<string> {
    const amount = this.addressToTotalStakedAmountMap.get(stakeOwner);
    return amount ? amount.toString() : '0';
  }

  async readTotalStakedTokens(): Promise<string> {
    return this.totalStakedTokens;
  }

  async readUnstakeStatus(stakeOwner: string): Promise<IStakingStatus> {
    const status = this.addressToStakeStatus.get(stakeOwner);
    return status ? status : { cooldownAmount: 0, cooldownEndTime: 0 };
  }

  public getStakingContractAddress(): string {
    return this.stakingContractAddress;
  }

  // STATE SUBSCRIPTIONS //
  subscribeToStakeAmountChange(stakeOwner: string, callback: StakeAmountChangeCallback): () => Promise<boolean> {
    const callbackAdapter = (error: Error, stakedAmountInEvent: string, totalStakedAmount: string) =>
      callback(error, totalStakedAmount);

    const stakeEventUnsubscribe = this.subscribeToStakedEvent(stakeOwner, callbackAdapter);
    const unstakeEventUnsubscribe = this.subscribeToUnstakedEvent(stakeOwner, callbackAdapter);
    const restakeEventUnsubscribe = this.subscribeToRestakedEvent(stakeOwner, callbackAdapter);

    return async () => {
      try {
        await Promise.all([stakeEventUnsubscribe, unstakeEventUnsubscribe, restakeEventUnsubscribe]);
        return true;
      } catch (e) {
        return false;
      }
    };
  }

  // EVENTS SUBSCRIPTIONS //
  subscribeToStakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const stakeOwnerCallbacksMap = ensureAndGetInnerMap(this.stakedEventsMap, stakeOwner);

    return setValueWithUniqueIdAndUnsubscribeFunction(stakeOwnerCallbacksMap, callback);
  }

  subscribeToRestakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const stakeOwnerCallbacksMap = ensureAndGetInnerMap(this.restakedEventsMap, stakeOwner);

    return setValueWithUniqueIdAndUnsubscribeFunction(stakeOwnerCallbacksMap, callback);
  }

  subscribeToUnstakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const stakeOwnerCallbacksMap = ensureAndGetInnerMap(this.unstakedEventsMap, stakeOwner);

    return setValueWithUniqueIdAndUnsubscribeFunction(stakeOwnerCallbacksMap, callback);
  }

  subscribeToWithdrewEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const stakeOwnerCallbacksMap = ensureAndGetInnerMap(this.withdrewEventsMap, stakeOwner);

    return setValueWithUniqueIdAndUnsubscribeFunction(stakeOwnerCallbacksMap, callback);
  }

  // Test Utils //

  public withStakeBalance(address: string, amount: number) {
    this.addressToTotalStakedAmountMap.set(address, amount);
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

  // Subscription triggering

  private triggerStakedEvent(stakeOwner: string, stakedAmount: string, totalStakedAmount: string): void {
    this.triggerStakingContractEvent(this.stakedEventsMap, stakeOwner, stakedAmount, totalStakedAmount);
  }

  private triggerRestakedEvent(stakeOwner: string, stakedAmount: string, totalStakedAmount: string): void {
    this.triggerStakingContractEvent(this.restakedEventsMap, stakeOwner, stakedAmount, totalStakedAmount);
  }

  private triggerUnstakedEvent(stakeOwner: string, stakedAmount: string, totalStakedAmount: string): void {
    this.triggerStakingContractEvent(this.unstakedEventsMap, stakeOwner, stakedAmount, totalStakedAmount);
  }

  private triggerWithdrewEvent(stakeOwner: string, stakedAmount: string, totalStakedAmount: string): void {
    this.triggerStakingContractEvent(this.withdrewEventsMap, stakeOwner, stakedAmount, totalStakedAmount);
  }

  /**
   * All of the staking-related events of this service share the same signature, and so, we can trigger any event subscribed callbacks with
   * this function.
   */
  private triggerStakingContractEvent(
    eventCallbackMap: Map<string, Map<number, StakingServiceEventCallback>>,
    stakeOwner: string,
    stakedAmount: string,
    totalStakedAmount: string,
  ) {
    callAllEventCallbacks(eventCallbackMap, stakeOwner, callback => callback(null, stakedAmount, totalStakedAmount));
  }
}

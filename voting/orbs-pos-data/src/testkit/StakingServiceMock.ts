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
  private cooldownReleaseTimestamp: number;

  private stakingContractAddress: string = 'DUMMY_CONTRACT_ADDRESS';
  private addressToTotalStakedAmountMap: Map<string, number> = new Map();
  private addressToCooldownStatus: Map<string, IStakingStatus> = new Map();
  private totalStakedTokens: string = '0';

  private stakedEventsMap: Map<string, Map<number, StakingServiceEventCallback>> = new Map();
  private restakedEventsMap: Map<string, Map<number, StakingServiceEventCallback>> = new Map();
  private unstakedEventsMap: Map<string, Map<number, StakingServiceEventCallback>> = new Map();
  private withdrewEventsMap: Map<string, Map<number, StakingServiceEventCallback>> = new Map();

  constructor(autoCompleteTxes: boolean = true) {
    this.txsMocker = new TxsMocker<TTxCreatingActionNames>(autoCompleteTxes);
    const nowInSeconds = new Date().getTime() / 1000;
    this.cooldownReleaseTimestamp = nowInSeconds + 60 * 60 * 24;
  }

  // CONFIG //
  setFromAccount(address: string): void {
    this.txsMocker.setFromAccount(address);
  }

  getCooldownReleaseTimestamp(): number {
    return this.cooldownReleaseTimestamp;
  }

  setCooldownReleaseTimestamp(cooldownReleaseTimestamp: number): void {
    this.cooldownReleaseTimestamp = cooldownReleaseTimestamp;
  }

  // WRITE (TX creation) //
  stake(amount: number): PromiEvent<TransactionReceipt> {
    const stakeOwner = this.txsMocker.getFromAccount();

    const txEffect = () => {
      const totalStakedAmount = this.updateStakedTokensForOwner(stakeOwner, amount);
      this.updateTotalStakedTokens(amount);

      this.triggerStakedEvent(stakeOwner, amount.toString(), totalStakedAmount.toString());
    };
    return this.txsMocker.createTxOf('stake', txEffect);
  }

  unstake(amount: number): PromiEvent<TransactionReceipt> {
    const stakeOwner = this.txsMocker.getFromAccount();
    const txEffect = () => {
      const totalStakedAmount = this.updateStakedTokensForOwner(stakeOwner, -amount);
      this.updateTotalStakedTokens(-amount);

      this.setOrUpdateCooldownStatusForOwner(stakeOwner, amount);

      this.triggerUnstakedEvent(stakeOwner, amount.toString(), totalStakedAmount.toString());
    };

    return this.txsMocker.createTxOf('unstake', txEffect);
  }

  restake(): PromiEvent<TransactionReceipt> {
    const stakeOwner = this.txsMocker.getFromAccount();
    let txEffect = () => {}; // No orbs in cooldown, no effect

    // Owner has orbs in cooldown ?
    if (this.addressToCooldownStatus.has(stakeOwner)) {
      const cooldownStatus = this.addressToCooldownStatus.get(stakeOwner);
      const { cooldownAmount } = cooldownStatus;

      txEffect = () => {
        // Nothing left in cooldown
        this.clearCooldownStatusForOwner(stakeOwner);

        this.updateTotalStakedTokens(cooldownAmount);
      };
    }

    return this.txsMocker.createTxOf('restake', txEffect);
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
    const status = this.addressToCooldownStatus.get(stakeOwner);
    return status ? status : { cooldownAmount: 0, cooldownEndTime: 0 };
  }

  public getStakingContractAddress(): string {
    return this.stakingContractAddress;
  }

  // STATE SUBSCRIPTIONS //
  subscribeToStakeAmountChange(stakeOwner: string, callback: StakeAmountChangeCallback): () => Promise<boolean> {
    // DEV_NOTE : This implementation is identical to the real service
    const callbackAdapter = (error: Error, stakedAmountInEvent: string, totalStakedAmount: string) =>
      callback(error, totalStakedAmount);

    const stakeEventUnsubscribe = this.subscribeToStakedEvent(stakeOwner, callbackAdapter);
    const unstakeEventUnsubscribe = this.subscribeToUnstakedEvent(stakeOwner, callbackAdapter);
    const restakeEventUnsubscribe = this.subscribeToRestakedEvent(stakeOwner, callbackAdapter);

    return async () => {
      try {
        await Promise.all([stakeEventUnsubscribe(), unstakeEventUnsubscribe(), restakeEventUnsubscribe()]);
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
    this.addressToCooldownStatus.set(address, status);
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

  // Inner state changes
  private updateTotalStakedTokens(byAmount: number) {
    const currentTotalStakedSumAsNumber = parseInt(this.totalStakedTokens);
    const updatedTotalStakedSumAsNumber = currentTotalStakedSumAsNumber + byAmount;
    this.totalStakedTokens = updatedTotalStakedSumAsNumber.toString();
  }

  private updateStakedTokensForOwner(stakeOwner: string, byAmount: number): number {
    const currentStakedAmount = this.addressToTotalStakedAmountMap.get(stakeOwner) || 0;
    const totalStakedAmountForOwner = currentStakedAmount + byAmount;
    this.addressToTotalStakedAmountMap.set(stakeOwner, totalStakedAmountForOwner);

    return totalStakedAmountForOwner;
  }

  private setOrUpdateCooldownStatusForOwner(stakeOwner: string, byAmount: number) {
    if (!this.addressToCooldownStatus.has(stakeOwner)) {
      const defaultCooldownStatus: IStakingStatus = {
        cooldownAmount: 0,
        cooldownEndTime: this.cooldownReleaseTimestamp,
      };

      this.addressToCooldownStatus.set(stakeOwner, defaultCooldownStatus);
    }

    const cooldownStatus = this.addressToCooldownStatus.get(stakeOwner);

    // Update amount
    cooldownStatus.cooldownAmount += byAmount;
    cooldownStatus.cooldownEndTime = this.cooldownReleaseTimestamp;
  }

  private clearCooldownStatusForOwner(stakeOwner: string) {
    this.addressToCooldownStatus.delete(stakeOwner);
  }
}

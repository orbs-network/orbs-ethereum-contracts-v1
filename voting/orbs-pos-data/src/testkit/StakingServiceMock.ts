import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IStakingService, IUnstakingStatus, StakingServiceEventCallback } from '../interfaces/IStakingService';
import { TUnsubscribeFunction } from '../services/contractsTypes/contractTypes';
import { ITxCreatingServiceMock } from './ITxCreatingServiceMock';
import { TxsMocker } from './TxsMocker';
import { EventSubscriber } from './utils/EventSubscriber';

type TTxCreatingActionNames = 'stake' | 'unstake' | 'restake' | 'withdraw';

export class StakingServiceMock implements IStakingService, ITxCreatingServiceMock {
  public readonly txsMocker: TxsMocker<TTxCreatingActionNames>;
  private cooldownReleaseTimestamp: number;

  private stakingContractAddress: string = 'DUMMY_CONTRACT_ADDRESS';
  private addressToTotalStakedAmountMap: Map<string, bigint> = new Map();
  private addressToCooldownStatus: Map<string, IUnstakingStatus> = new Map();
  private totalStakedTokens: bigint = BigInt(0);

  private stakedEventsSubscriber: EventSubscriber<StakingServiceEventCallback> = new EventSubscriber();
  private restakedEventsSubscriber: EventSubscriber<StakingServiceEventCallback> = new EventSubscriber();
  private unstakedEventsSubscriber: EventSubscriber<StakingServiceEventCallback> = new EventSubscriber();
  private withdrewEventsSubscriber: EventSubscriber<StakingServiceEventCallback> = new EventSubscriber();

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
  stake(amount: bigint): PromiEvent<TransactionReceipt> {
    const stakeOwner = this.txsMocker.getFromAccount();

    const txEffect = () => {
      const totalStakedAmount = this.updateStakedTokensForOwnerBy(stakeOwner, amount);

      this.triggerStakedEvent(stakeOwner, amount, totalStakedAmount);
    };
    return this.txsMocker.createTxOf('stake', txEffect);
  }

  unstake(amount: bigint): PromiEvent<TransactionReceipt> {
    const stakeOwner = this.txsMocker.getFromAccount();
    const txEffect = () => {
      const totalStakedAmountByOwner = this.updateStakedTokensForOwnerBy(stakeOwner, -amount);

      this.setOrUpdateCooldownStatusForOwner(stakeOwner, amount);

      this.triggerUnstakedEvent(stakeOwner, amount, totalStakedAmountByOwner);
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
        // Nothing left in cooldown after a restake
        this.clearCooldownStatusForOwner(stakeOwner);

        // Add unstaked amount to the owner total staked amount
        const totalStakedAmountByOwner = this.updateStakedTokensForOwnerBy(stakeOwner, cooldownAmount);

        // Trigger event
        this.triggerRestakedEvent(stakeOwner, cooldownAmount, totalStakedAmountByOwner);
      };
    }

    return this.txsMocker.createTxOf('restake', txEffect);
  }

  withdraw(): PromiEvent<TransactionReceipt> {
    const stakeOwner = this.txsMocker.getFromAccount();
    let txEffect = () => {}; // No orbs in cooldown, no effect

    // Owner has orbs in cooldown ?
    if (this.addressToCooldownStatus.has(stakeOwner)) {
      const cooldownStatus = this.addressToCooldownStatus.get(stakeOwner);
      const { cooldownAmount } = cooldownStatus;

      txEffect = () => {
        // Nothing left in cooldown after a restake
        this.clearCooldownStatusForOwner(stakeOwner);

        // DEV_NOTE : The total amount of staked orbs should not get effected.
        const totalStakedAmountByOwner = this.getTotalStakedAmountFor(stakeOwner);

        // Trigger event
        this.triggerWithdrewEvent(stakeOwner, cooldownAmount, totalStakedAmountByOwner);
      };
    }

    return this.txsMocker.createTxOf('withdraw', txEffect);
  }

  // READ //
  async readStakeBalanceOf(stakeOwner: string): Promise<bigint> {
    const amount = this.getTotalStakedAmountFor(stakeOwner);
    return amount ? amount : BigInt(0);
  }

  async readTotalStakedTokens(): Promise<bigint> {
    return this.totalStakedTokens;
  }

  async readUnstakeStatus(stakeOwner: string): Promise<IUnstakingStatus> {
    const status = this.addressToCooldownStatus.get(stakeOwner);
    return status ? status : { cooldownAmount: BigInt(0), cooldownEndTime: 0 };
  }

  public getStakingContractAddress(): string {
    return this.stakingContractAddress;
  }

  // EVENTS SUBSCRIPTIONS //
  subscribeToStakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    return this.stakedEventsSubscriber.subscribeToEvent(stakeOwner, callback);
  }

  subscribeToRestakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    return this.restakedEventsSubscriber.subscribeToEvent(stakeOwner, callback);
  }

  subscribeToUnstakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    return this.unstakedEventsSubscriber.subscribeToEvent(stakeOwner, callback);
  }

  subscribeToWithdrewEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    return this.withdrewEventsSubscriber.subscribeToEvent(stakeOwner, callback);
  }

  // Test Utils //

  public withStakeBalance(address: string, amount: bigint) {
    this.addressToTotalStakedAmountMap.set(address, amount);
  }

  public withTotalStakedTokens(amount: bigint) {
    this.totalStakedTokens = amount;
  }

  public withUnstakeStatus(address: string, status: IUnstakingStatus) {
    this.addressToCooldownStatus.set(address, status);
  }

  public withStakingContractAddress(address: string) {
    this.stakingContractAddress = address;
  }

  // Subscription triggering

  private triggerStakedEvent(stakeOwner: string, stakedAmount: bigint, totalStakedAmount: bigint): void {
    this.triggerStakingContractEvent(this.stakedEventsSubscriber, stakeOwner, stakedAmount, totalStakedAmount);
  }

  private triggerRestakedEvent(stakeOwner: string, stakedAmount: bigint, totalStakedAmount: bigint): void {
    this.triggerStakingContractEvent(this.restakedEventsSubscriber, stakeOwner, stakedAmount, totalStakedAmount);
  }

  private triggerUnstakedEvent(stakeOwner: string, stakedAmount: bigint, totalStakedAmount: bigint): void {
    this.triggerStakingContractEvent(this.unstakedEventsSubscriber, stakeOwner, stakedAmount, totalStakedAmount);
  }

  private triggerWithdrewEvent(stakeOwner: string, stakedAmount: bigint, totalStakedAmount: bigint): void {
    this.triggerStakingContractEvent(this.withdrewEventsSubscriber, stakeOwner, stakedAmount, totalStakedAmount);
  }

  /**
   * All of the staking-related events of this service share the same signature, and so, we can trigger any event subscribed callbacks with
   * this function.
   */
  private triggerStakingContractEvent(
    singleKeyEventSubscriber: EventSubscriber<StakingServiceEventCallback>,
    stakeOwner: string,
    stakedAmount: bigint,
    totalStakedAmount: bigint,
  ) {
    singleKeyEventSubscriber.triggerEventCallbacks(stakeOwner, callback =>
      callback(null, stakedAmount, totalStakedAmount),
    );
  }

  // Inner getters
  private getTotalStakedAmountFor(stakeOwner: string): bigint {
    return this.addressToTotalStakedAmountMap.get(stakeOwner) || BigInt(0);
  }

  // Inner state changes
  private updateTotalStakedTokensBy(byAmount: bigint) {
    this.totalStakedTokens = this.totalStakedTokens + byAmount;
  }

  private updateStakedTokensForOwnerBy(stakeOwner: string, byAmount: bigint): bigint {
    // Updates the balance for the owner
    const currentStakedAmount = this.getTotalStakedAmountFor(stakeOwner);
    const totalStakedAmountForOwner = currentStakedAmount + byAmount;
    this.addressToTotalStakedAmountMap.set(stakeOwner, totalStakedAmountForOwner);

    // Update the balance for total staked orbs (by all owners)
    this.updateTotalStakedTokensBy(byAmount);

    return totalStakedAmountForOwner;
  }

  private setOrUpdateCooldownStatusForOwner(stakeOwner: string, byAmount: bigint) {
    if (!this.addressToCooldownStatus.has(stakeOwner)) {
      const defaultCooldownStatus: IUnstakingStatus = {
        cooldownAmount: BigInt(0),
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

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { PromiEvent, TransactionReceipt } from 'web3-core';
import { TUnsubscribeFunction } from '../services/contractsTypes/contractTypes';

// TODO : NEXT_MAJOR : Change this to 'ICooldownStatus' on next major version
export interface IStakingStatus {
  cooldownAmount: number;
  cooldownEndTime: number;
}

export type StakeAmountChangeCallback = (error: Error, amount: string) => void;
export type StakingServiceEventCallback = (error: Error, amount: string, totalStakedAmount: string) => void;

export interface IStakingService {
  getStakingContractAddress(): string;
  setFromAccount(address: string): void;

  stake(amount: number): PromiEvent<TransactionReceipt>;
  unstake(amount: number): PromiEvent<TransactionReceipt>;
  restake(): PromiEvent<TransactionReceipt>;
  withdraw(): PromiEvent<TransactionReceipt>;

  readStakeBalanceOf(stakeOwner: string): Promise<string>;
  readTotalStakedTokens(): Promise<string>;
  readUnstakeStatus(stakeOwner: string): Promise<IStakingStatus>;

  // TODO : NEXT_MAJOR : Delete this
  /**
   * @deprecated
   */
  subscribeToStakeAmountChange(stakeOwner: string, callback: StakeAmountChangeCallback): TUnsubscribeFunction;

  subscribeToStakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction;
  subscribeToUnstakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction;
  subscribeToRestakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction;
  subscribeToWithdrewEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction;
}

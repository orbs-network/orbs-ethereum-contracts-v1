/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { PromiEvent, TransactionReceipt } from 'web3-core';
import { TUnsubscribeFunction } from '../services/contractsTypes/contractTypes';

export interface IUnstakingStatus {
  cooldownAmount: bigint;
  cooldownEndTime: number;
}

export type StakeAmountChangeCallback = (error: Error, amount: bigint) => void;
export type StakingServiceEventCallback = (error: Error, amount: bigint, totalStakedAmount: bigint) => void;

export interface IStakingService {
  getStakingContractAddress(): string;
  setFromAccount(address: string): void;

  stake(amount: bigint): PromiEvent<TransactionReceipt>;
  unstake(amount: bigint): PromiEvent<TransactionReceipt>;
  restake(): PromiEvent<TransactionReceipt>;
  withdraw(): PromiEvent<TransactionReceipt>;

  readStakeBalanceOf(stakeOwner: string): Promise<bigint>;
  readTotalStakedTokens(): Promise<bigint>;
  readUnstakeStatus(stakeOwner: string): Promise<IUnstakingStatus>;

  subscribeToStakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction;
  subscribeToUnstakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction;
  subscribeToRestakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction;
  subscribeToWithdrewEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction;
}

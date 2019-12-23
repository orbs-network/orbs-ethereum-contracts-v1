/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { PromiEvent, TransactionReceipt } from 'web3-core';

export interface IStakingStatus { 
  cooldownAmount: number; 
  cooldownEndTime: number;
}

export interface IStakingService {
  stake(amount: number): PromiEvent<TransactionReceipt>;
  unstake(amount: number): PromiEvent<TransactionReceipt>;
  restake(): PromiEvent<TransactionReceipt>;
  withdraw(): PromiEvent<TransactionReceipt>;
  getStakeBalanceOf(stakeOwner: string): Promise<string>;
  getTotalStakedTokens(): Promise<string>;
  getUnstakeStatus(stakeOwner: string): Promise<IStakingStatus>;
}

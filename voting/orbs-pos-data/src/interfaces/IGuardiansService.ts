/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IDelegationInfo } from './IDelegationInfo';
import { IGuardianInfo } from './IGuardianInfo';

export interface IGuardiansService {
  setFromAccount(address: string): void;
  selectGuardian(guardianAddress: string): PromiEvent<TransactionReceipt>;
  readSelectedGuardianAddress(accountAddress: string): Promise<string>;
  readDelegationInfo(address: string): Promise<IDelegationInfo>;
  readGuardiansList(offset: number, limit: number): Promise<string[]>;
  readGuardianInfo(guardianAddress: string): Promise<IGuardianInfo>;
}

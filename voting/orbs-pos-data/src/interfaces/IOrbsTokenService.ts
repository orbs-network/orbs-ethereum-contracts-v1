/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { PromiEvent, TransactionReceipt } from 'web3-core';

export interface IOrbsTokenService {
  setFromAccount(address: string): IOrbsTokenService;
  getAllowance(ownerAddress: string, spenderAddress: string): Promise<string>;
  approve(spenderAddress: string, amountInOrbs: number): PromiEvent<TransactionReceipt>;

  /**
   * Triggers the given callback when an 'Approval' event is emitted.
   * IMPORTANT NOTE : The ORBS ERC20 contract does not emit any event when 'transferFrom' is called.
   *                  and so, even though the 'allowance' will decrease, the callback will not get called.
   */
  subscribeToAllowanceChange(
    ownerAddress: string,
    spenderAddress: string,
    callback: (allowance: string) => void,
  ): () => void;
}

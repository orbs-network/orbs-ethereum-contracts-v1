/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as IStakingContractABI from 'orbs-staking-contract/build/abi/IStakingContract.json';
import Web3 from 'web3';
import { PromiEvent, TransactionReceipt } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { IStakingService, IStakingStatus } from '../interfaces/IStakingService';
import { STAKING_CONTRACT_ADDRESS } from '../contracts-adresses';

export class StakingService implements IStakingService {
  private readonly stakingContractAddress: string;
  private stakingContract: Contract;

  constructor(private web3: Web3, address: string = STAKING_CONTRACT_ADDRESS) {
    this.stakingContractAddress = address;
    this.stakingContract = new this.web3.eth.Contract(IStakingContractABI as AbiItem[], this.stakingContractAddress);
  }

  // CONFIG //
  setFromAccount(address: string): void {
    this.stakingContract.options.from = address;
  }

  getStakingContractAddress() {
    return this.stakingContractAddress;
  }

  // WRITE //
  stake(amount: number): PromiEvent<TransactionReceipt> {
    return this.stakingContract.methods.stake(amount).send();
  }

  unstake(amount: number): PromiEvent<TransactionReceipt> {
    return this.stakingContract.methods.unstake(amount).send();
  }

  restake(): PromiEvent<TransactionReceipt> {
    return this.stakingContract.methods.restake().send();
  }

  withdraw(): PromiEvent<TransactionReceipt> {
    return this.stakingContract.methods.withdraw().send();
  }

  // READ //
  async getStakeBalanceOf(stakeOwner: string): Promise<string> {
    return this.stakingContract.methods.getStakeBalanceOf(stakeOwner).call();
  }

  async getTotalStakedTokens(): Promise<string> {
    return this.stakingContract.methods.getTotalStakedTokens().call();
  }

  async getUnstakeStatus(stakeOwner: string): Promise<IStakingStatus> {
    const result = this.stakingContract.methods.getUnstakeStatus(stakeOwner).call();
    return {
      cooldownAmount: parseInt(result.cooldownAmount, 10),
      cooldownEndTime: parseInt(result.cooldownEndTime, 10),
    };
  }
}

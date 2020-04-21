/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import IStakingContractABI from 'orbs-staking-contract/build/abi/IStakingContract.json';
import Web3 from 'web3';
import { PromiEvent, TransactionReceipt } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { STAKING_CONTRACT_ADDRESS } from '../contracts-adresses';
import { IStakingService, IUnstakingStatus, StakingServiceEventCallback } from '../interfaces/IStakingService';
import { getUnsubscribePromise } from '../utils/erc20EventsUtils';
import { ITypedEventData, TUnsubscribeFunction } from './contractsTypes/contractTypes';
import stakingContractJSON from '../contracts/StakingContract.json';

/**
 * It just so happens that all of the staking related events have the same signature.
 * DEV_NOTE : The real object will also have array accessors ("1", "2", "3") that match the named members.
 * DEV_NOTE : Currently amounts are strings, in the future should change to bigint)
 */
interface IStakingContractEventValues {
  stakeOwner: string;
  // TODO : O.L : Change this to bigint after web3 change
  amount: string; // Amount for the event
  // TODO : O.L : Change this to bigint after web3 change
  totalStakedAmount: string; // Total staked amount for given owner
}

export class StakingService implements IStakingService {
  private readonly stakingContractAddress: string;
  private stakingContract: Contract;

  constructor(private web3: Web3, address: string = STAKING_CONTRACT_ADDRESS) {
    this.stakingContractAddress = address;
    this.stakingContract = new this.web3.eth.Contract(stakingContractJSON as AbiItem[], this.stakingContractAddress);
  }

  // CONFIG //
  setFromAccount(address: string): void {
    this.stakingContract.options.from = address;
  }

  getStakingContractAddress() {
    return this.stakingContractAddress;
  }

  // WRITE //
  stake(amount: bigint): PromiEvent<TransactionReceipt> {
    return this.stakingContract.methods.stake(amount.toString()).send();
  }

  unstake(amount: bigint): PromiEvent<TransactionReceipt> {
    return this.stakingContract.methods.unstake(amount.toString()).send();
  }

  restake(): PromiEvent<TransactionReceipt> {
    return this.stakingContract.methods.restake().send();
  }

  withdraw(): PromiEvent<TransactionReceipt> {
    return this.stakingContract.methods.withdraw().send();
  }

  // READ //
  async readStakeBalanceOf(stakeOwner: string): Promise<bigint> {
    return this.stakingContract.methods.getStakeBalanceOf(stakeOwner).call();
  }

  async readTotalStakedTokens(): Promise<bigint> {
    return this.stakingContract.methods.getTotalStakedTokens().call();
  }

  async readUnstakeStatus(stakeOwner: string): Promise<IUnstakingStatus> {
    const result = await this.stakingContract.methods.getUnstakeStatus(stakeOwner).call();

    let cooldownAmountBigInt = BigInt(result.cooldownAmount);
    let cooldownEndTimeNumber = Number(result.cooldownEndTime);

    // DEV_NOTE : NaN means that the given stake owner has no "active" cooldown process.
    // DEV_NOTE : We have removed the check for "typeof cooldownAmountBigInt != 'bigint'" in order to support polyfills
    //            of Bigint.
    if (Number.isNaN(cooldownEndTimeNumber)) {
      cooldownAmountBigInt = BigInt(0);
      cooldownEndTimeNumber = 0;
    }

    return {
      cooldownAmount: cooldownAmountBigInt,
      cooldownEndTime: cooldownEndTimeNumber,
    };
  }

  // Events Subscriptions //
  public subscribeToStakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const eventSubscriptionFunction = this.stakingContract.events.Staked;
    return this.subscribeToStakingContractEvent(eventSubscriptionFunction, stakeOwner, callback);
  }

  public subscribeToUnstakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const eventSubscriptionFunction = this.stakingContract.events.Unstaked;
    return this.subscribeToStakingContractEvent(eventSubscriptionFunction, stakeOwner, callback);
  }

  public subscribeToRestakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const eventSubscriptionFunction = this.stakingContract.events.Restaked;
    return this.subscribeToStakingContractEvent(eventSubscriptionFunction, stakeOwner, callback);
  }

  public subscribeToWithdrewEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const eventSubscriptionFunction = this.stakingContract.events.Withdrew;
    return this.subscribeToStakingContractEvent(eventSubscriptionFunction, stakeOwner, callback);
  }

  /**
   * Dev Note : O.L : This function should be extracted and isolated for testing purpose.
   * Dev Note #2 : All the events of the 'Staking contract' have exactly the same signature.
   */
  private subscribeToStakingContractEvent(
    eventSubscriptionFunction: any,
    stakeOwner: string,
    callback: (error: Error, amount: bigint, totalStakedOrbs: bigint) => void,
  ): () => Promise<boolean> {
    const specificEventEmitter = eventSubscriptionFunction(
      {
        filter: {
          stakeOwner: [stakeOwner],
        },
      },
      (error: Error, event: ITypedEventData<IStakingContractEventValues>) => {
        if (error) {
          callback(error, null, null);
          return;
        }

        callback(null, BigInt(event.returnValues.amount), BigInt(event.returnValues.totalStakedAmount));
      },
    );

    return () => getUnsubscribePromise(specificEventEmitter);
  }
}

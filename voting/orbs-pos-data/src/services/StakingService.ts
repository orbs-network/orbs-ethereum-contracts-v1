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
import { Contract, EventData } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { STAKING_CONTRACT_ADDRESS } from '../contracts-adresses';
import {
  IStakingService,
  IStakingStatus,
  StakeAmountChangeCallback,
  StakingServiceEventCallback,
} from '../interfaces/IStakingService';
import { getUnsubscribePromise } from '../utils/erc20EventsUtils';
import { ITypedEventData, TUnsubscribeFunction } from './contractsTypes/contractTypes';

/**
 * It just so happens that all of the staking related events have the same signature.
 */
interface IStakingContractEventValues {
  1: string;
  2: string;
  3: string;
  stakeOwner: string;
  amount: string; // Amount for the event
  totalStakedAmount: string; // Total staked amount for given owner
}

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
  async readStakeBalanceOf(stakeOwner: string): Promise<string> {
    return this.stakingContract.methods.getStakeBalanceOf(stakeOwner).call();
  }

  async readTotalStakedTokens(): Promise<string> {
    return this.stakingContract.methods.getTotalStakedTokens().call();
  }

  async readUnstakeStatus(stakeOwner: string): Promise<IStakingStatus> {
    const result = this.stakingContract.methods.getUnstakeStatus(stakeOwner).call();
    return {
      cooldownAmount: parseInt(result.cooldownAmount, 10),
      cooldownEndTime: parseInt(result.cooldownEndTime, 10),
    };
  }

  // State Subscriptions //
  subscribeToStakeAmountChange(stakeOwner: string, callback: StakeAmountChangeCallback): TUnsubscribeFunction {
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

  // Events Subscriptions //
  public subscribeToStakedEvent(stakeOwner: string, callback: StakingServiceEventCallback): TUnsubscribeFunction {
    const eventSubscriptionFunction = this.stakingContract.events.Stake;
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
    callback: (error: Error, amount: string, totalStakedOrbs: string) => void,
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

        const eventAmountInOrbsWei = event.returnValues.amount;
        const totalStakedAmountInOrbsWei = event.returnValues.totalStakedAmount;

        // TODO : O.L : Decide about the return format (wei-orbs vs complete orbs)
        const eventAmountInOrbs = this.web3.utils.fromWei(eventAmountInOrbsWei, 'ether');
        const totalStakedAmountInOrbs = this.web3.utils.fromWei(totalStakedAmountInOrbsWei, 'ether');

        callback(null, eventAmountInOrbs, totalStakedAmountInOrbs);
      },
    );

    return () => getUnsubscribePromise(specificEventEmitter);
  }
}

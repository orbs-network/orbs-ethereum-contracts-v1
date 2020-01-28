/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Web3 from 'web3';
import { Contract, EventData } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { IOrbsPosContractsAddresses } from '../contracts-adresses';
import orbsRewardsDistributionContractJSON from '../contracts/OrbsRewardsDistribution.json';
import validatorsContractJSON from '../contracts/OrbsValidators.json';
import validatorsRegistryContractJSON from '../contracts/OrbsValidatorsRegistry.json';
import erc20ContactAbi from '../erc20-abi';
import { IEthereumClientService } from '../interfaces/IEthereumClientService';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import { IValidatorData } from '../interfaces/IValidatorData';
import { getUnsubscribePromise } from '../utils/erc20EventsUtils';
import { ORBS_TDE_ETHEREUM_BLOCK } from './consts';
import { readUpcomingElectionBlockNumber } from './utils';

export class EthereumClientService implements IEthereumClientService {
  private orbsRewardsDistributionContract: Contract;
  private validatorsContract: Contract;
  private validatorsRegistryContract: Contract;
  private erc20Contract: Contract;

  constructor(private web3: Web3, addresses: IOrbsPosContractsAddresses) {
    this.orbsRewardsDistributionContract = new this.web3.eth.Contract(
      orbsRewardsDistributionContractJSON.abi as AbiItem[],
      addresses.orbsRewardsDistributionContract,
    );
    this.validatorsContract = new this.web3.eth.Contract(
      validatorsContractJSON.abi as AbiItem[],
      addresses.validatorsContract,
    );
    this.validatorsRegistryContract = new this.web3.eth.Contract(
      validatorsRegistryContractJSON.abi,
      addresses.validatorsRegistryContract,
    );
    this.erc20Contract = new this.web3.eth.Contract(erc20ContactAbi as AbiItem[], addresses.erc20Contract);
  }

  readValidators(): Promise<string[]> {
    return this.validatorsContract.methods.getValidators().call();
  }

  readValidatorData(address: string): Promise<IValidatorData> {
    return this.validatorsRegistryContract.methods.getValidatorData(address).call();
  }

  async readOrbsRewardsDistribution(address: string): Promise<IRewardsDistributionEvent[]> {
    const options = {
      fromBlock: ORBS_TDE_ETHEREUM_BLOCK,
      toBlock: 'latest',
      filter: { recipient: address },
    };

    const events = await this.orbsRewardsDistributionContract.getPastEvents('RewardDistributed', options);

    const readRewards = events.map(log => {
      return {
        distributionEvent: log.returnValues.distributionEvent as string,
        amount: BigInt(log.returnValues.amount),
        transactionHash: log.transactionHash,
      };
    });

    return readRewards;
  }

  readUpcomingElectionBlockNumber(): Promise<number> {
    return readUpcomingElectionBlockNumber(this.web3);
  }

  async readOrbsBalance(address: string): Promise<bigint> {
    const balance = await this.erc20Contract.methods.balanceOf(address).call();
    return BigInt(balance);
  }

  // TODO : FUTURE : We need to change the signature of this function to have a standard callback usage (with err and values).
  //                  or to find a way to handle errors.
  subscribeToORBSBalanceChange(address: string, callback: (orbsBalance: bigint) => void): () => void {
    const transferFromAddressEventEmitter = this.erc20Contract.events.Transfer(
      {
        filter: {
          from: [address],
        },
      },
      async (error: Error, event: EventData) => {
        if (error) {
          throw error;
        }

        const newBalance = await this.readOrbsBalance(address);
        callback(newBalance);
      },
    );

    const transferToAddressEventEmitter = this.erc20Contract.events.Transfer(
      {
        filter: {
          to: [address],
        },
      },
      async (error: Error, event: EventData) => {
        if (error) {
          throw error;
        }

        // A very edge-casey validation, prevents the callback from getting called twice in case someone sends ORBs to himself
        if (event.raw.topics[1] === event.raw.topics[2]) {
          return;
        }

        const newBalance = await this.readOrbsBalance(address);
        callback(newBalance);
      },
    );

    return async () => {
      let unsubscribeOfFromAddressPromise = getUnsubscribePromise(transferFromAddressEventEmitter);
      let unsubscribeOfToAddressPromise = getUnsubscribePromise(transferToAddressEventEmitter);

      return Promise.all([unsubscribeOfFromAddressPromise, unsubscribeOfToAddressPromise]);
    };
  }
}

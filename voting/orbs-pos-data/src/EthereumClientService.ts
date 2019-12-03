/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Web3 from 'web3';
import { Contract, EventData } from 'web3-eth-contract';
import { Subscription } from 'web3-core-subscriptions';
import { AbiItem } from 'web3-utils';
import contractsInfo from './contracts-info';
import guardiansContractJSON from './contracts/OrbsGuardians.json';
import orbsRewardsDistributionContractJSON from './contracts/OrbsRewardsDistribution.json';
import validatorsContractJSON from './contracts/OrbsValidators.json';
import validatorsRegistryContractJSON from './contracts/OrbsValidatorsRegistry.json';
import votingContractJSON from './contracts/OrbsVoting.json';
import erc20ContactAbi from './erc20-abi';
import { IEthereumClientService } from './interfaces/IEthereumClientService';
import { IValidatorData } from './interfaces/IValidatorData';
import { IGuardianData } from './interfaces/IGuardianData';
import { IDelegationData } from './interfaces/IDelegationData';
import { IRewardsDistributionEvent } from './interfaces/IRewardsDistributionEvent';

const FIRST_ELECTION_BLOCK_HEIGHT = 7528900;
const INTERVAL_BETWEEN_ELECTIONS = 20000;
const VALID_VOTE_LENGTH = 45500;
const OrbsTDEEthereumBlock = 7439168;

export const NOT_DELEGATED = '0x0000000000000000000000000000000000000000';

export class EthereumClientService implements IEthereumClientService {
  private guardiansContract: Contract;
  private votingContract: Contract;
  private orbsRewardsDistributionContract: Contract;
  private validatorsContract: Contract;
  private validatorsRegistryContract: Contract;
  private erc20Contract: Contract;

  constructor(private web3: Web3) {
    this.guardiansContract = new this.web3.eth.Contract(
      guardiansContractJSON.abi,
      contractsInfo.EthereumGuardiansContract.address,
    );
    this.votingContract = new this.web3.eth.Contract(
      votingContractJSON.abi,
      contractsInfo.EthereumVotingContract.address,
    );
    this.orbsRewardsDistributionContract = new this.web3.eth.Contract(
      orbsRewardsDistributionContractJSON.abi as AbiItem[],
      contractsInfo.EthereumOrbsRewardsDistributionContract.address,
    );
    this.validatorsContract = new this.web3.eth.Contract(
      validatorsContractJSON.abi as AbiItem[],
      contractsInfo.EthereumValidatorsContract.address,
    );
    this.validatorsRegistryContract = new this.web3.eth.Contract(
      validatorsRegistryContractJSON.abi,
      contractsInfo.EthereumValidatorsRegistryContract.address,
    );
    this.erc20Contract = new this.web3.eth.Contract(
      erc20ContactAbi as AbiItem[],
      contractsInfo.EthereumErc20Address.address,
    );
  }

  getValidators(): Promise<string[]> {
    return this.validatorsContract.methods.getValidators().call();
  }

  getValidatorData(address: string): Promise<IValidatorData> {
    return this.validatorsRegistryContract.methods.getValidatorData(address).call();
  }

  getGuardians(offset: number, limit: number): Promise<string[]> {
    return this.guardiansContract.methods.getGuardians(offset, limit).call();
  }

  async getGuardianData(address: string): Promise<IGuardianData> {
    const [guardianData, currentVote, upcomingElectionsBlockNumber] = await Promise.all([
      this.guardiansContract.methods.getGuardianData(address).call(),
      this.votingContract.methods.getCurrentVote(address).call(),
      this.getUpcomingElectionBlockNumber(),
    ]);

    const votedAtBlockNumber = parseInt(currentVote.blockNumber);
    return {
      name: guardianData.name,
      website: guardianData.website,
      hasEligibleVote: votedAtBlockNumber + VALID_VOTE_LENGTH > upcomingElectionsBlockNumber,
      currentVote: currentVote.validators,
    };
  }

  async getCurrentDelegationByDelegate(address: string): Promise<IDelegationData> {
    const from = address;

    let currentDelegation = await this.votingContract.methods.getCurrentDelegation(from).call({ from });

    if (currentDelegation === NOT_DELEGATED) {
      return {
        delegatedTo: currentDelegation,
      };
    }

    const options = {
      fromBlock: OrbsTDEEthereumBlock,
      toBlock: 'latest',
      filter: {
        delegator: this.web3.utils.padLeft(address, 40, '0'),
        to: this.web3.utils.padLeft(currentDelegation, 40, '0'),
      },
    };

    const events = await this.votingContract.getPastEvents('Delegate', options);
    const lastEvent = events.pop();

    let { timestamp } = await this.web3.eth.getBlock(lastEvent.blockNumber);
    timestamp = ensureNumericValue(timestamp);

    return {
      delegatedTo: currentDelegation,
      delegationBlockNumber: lastEvent.blockNumber,
      delegationTimestamp: timestamp * 1000,
    };
  }

  async getOrbsRewardsDistribution(address: string): Promise<IRewardsDistributionEvent[]> {
    const options = {
      fromBlock: OrbsTDEEthereumBlock,
      toBlock: 'latest',
      filter: { recipient: address },
    };

    const events = await this.orbsRewardsDistributionContract.getPastEvents('RewardDistributed', options);

    const readRewards = events.map(log => {
      return {
        distributionEvent: log.returnValues.distributionEvent as string,
        amount: parseInt(log.returnValues.amount, 10) / 10 ** 18,
        transactionHash: log.transactionHash,
      };
    });

    return readRewards;
  }

  async getCurrentDelegationByTransfer(address: string): Promise<IDelegationData> {
    const delegationConstant = '0x00000000000000000000000000000000000000000000000000f8b0a10e470000';

    const paddedAddress = this.web3.utils.padLeft(address, 40, '0');
    const options = {
      fromBlock: OrbsTDEEthereumBlock,
      toBlock: 'latest',
      filter: { from: paddedAddress },
    };

    const events = await this.erc20Contract.getPastEvents('Transfer', options);

    const entryWithTransaction = events.reverse().find(({ raw }) => raw['data'] === delegationConstant);

    if (!entryWithTransaction) {
      return {
        delegatedTo: NOT_DELEGATED,
      };
    }

    let { timestamp } = await this.web3.eth.getBlock(entryWithTransaction.blockNumber);
    timestamp = ensureNumericValue(timestamp);
    const help = entryWithTransaction['raw']['topics'][2];

    return {
      delegatedTo: '0x' + help.substring(26, 66),
      delegationBlockNumber: entryWithTransaction.blockNumber,
      delegationTimestamp: timestamp * 1000,
    };
  }

  async getUpcomingElectionBlockNumber(): Promise<number> {
    let amountOfElections = 0;
    let upcomingElectionsBlockNumber = 0;
    const currentBlockNumber = await this.web3.eth.getBlockNumber();
    while (upcomingElectionsBlockNumber < currentBlockNumber) {
      amountOfElections += 1;
      upcomingElectionsBlockNumber = FIRST_ELECTION_BLOCK_HEIGHT + INTERVAL_BETWEEN_ELECTIONS * amountOfElections;
    }
    return upcomingElectionsBlockNumber;
  }

  async getOrbsBalance(address: string): Promise<string> {
    const balance = await this.erc20Contract.methods.balanceOf(address).call();
    return this.web3.utils.fromWei(balance, 'ether');
  }

  // TODO : FUTURE : We need to change the signature of this function to have a standard callback usage (with err and values).
  //                  or to find a way to handle errors.
  subscribeToORBSBalanceChange(address: string, callback: (orbsBalance: string) => void): () => void {
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

        const newBalance = await this.getOrbsBalance(address);
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

        const newBalance = await this.getOrbsBalance(address);
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

/**
 * If the event is not yet subscribed (and so, has 'id' value of null) the 'unsubscribe' call will not work and the CB will get called.
 * Therefore we will wait until it is connected in order to disconnect it.
 */
function getUnsubscribePromise(eventEmitter: Subscription<EventData>) {
  let unsubscribePromise;

  if (eventEmitter.id === null) {
    unsubscribePromise = new Promise((resolve, reject) => {
      // @ts-ignore (the 'connected' does not appear in the typing for some reason)
      eventEmitter.on('connected', async () => {
        try {
          await eventEmitter.unsubscribe();
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    });
  } else {
    unsubscribePromise = eventEmitter.unsubscribe();
  }

  return unsubscribePromise;
}

function ensureNumericValue(numberOrString: number | string): number {
  return typeof numberOrString === 'string' ? parseInt(numberOrString) : numberOrString;
}

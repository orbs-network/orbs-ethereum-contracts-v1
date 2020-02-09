/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Web3 from 'web3';
import isNil from 'lodash/isNil';
import { PromiEvent, TransactionReceipt } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { IOrbsPosContractsAddresses, MainnetContractsAddresses } from '../contracts-adresses';
import guardiansContractJSON from '../contracts/OrbsGuardians.json';
import votingContractJSON from '../contracts/OrbsVoting.json';
import erc20ContactAbi from '../erc20-abi';
import { IDelegationData } from '../interfaces/IDelegationData';
import { IDelegationInfo, TDelegationType } from '../interfaces/IDelegationInfo';
import { IGuardianData } from '../interfaces/IGuardianData';
import { IGuardianInfo } from '../interfaces/IGuardianInfo';
import { IGuardiansService } from '../interfaces/IGuardiansService';
import { IOrbsClientService } from '../interfaces/IOrbsClientService';
import { NOT_DELEGATED, ORBS_TDE_ETHEREUM_BLOCK, VALID_VOTE_LENGTH } from './consts';
import { readUpcomingElectionBlockNumber } from './utils';
import { ITypedEventData } from './contractsTypes/contractTypes';
import { getUnsubscribePromise } from '../utils/erc20EventsUtils';

function ensureNumericValue(numberOrString: number | string): number {
  return typeof numberOrString === 'string' ? parseInt(numberOrString) : numberOrString;
}

/**
 *
 * DEV_NOTE : The real object will also have array accessors ("1", "2", "3") that match the named members.
 * DEV_NOTE : Currently amounts are strings, in the future should change to bigint)
 */
interface IVotingContractDelegateEventValues {
  delegator: string;
  to: string;
  // TODO : O.L : Change this to bigint after web3 change
  delegationCounter: string;
}

interface IGuardianServiceOptions {
  earliestBlockForDelegation: number;
}

// TODO : FUTURE : The selection and reading of selected guardian happens on the 'Voting' contract.
//  We should create a dedicated service for that contract and its functionality.

export class GuardiansService implements IGuardiansService {
  private votingContract: Contract;
  private erc20Contract: Contract;
  private guardiansContract: Contract;

  private earliestBlockForDelegation: number;

  constructor(
    private web3: Web3,
    private orbsClientService: IOrbsClientService,
    addresses: Partial<IOrbsPosContractsAddresses> = MainnetContractsAddresses,
    options: Partial<IGuardianServiceOptions> = {},
  ) {
    this.votingContract = new this.web3.eth.Contract(votingContractJSON.abi as AbiItem[], addresses.votingContract);
    this.erc20Contract = new this.web3.eth.Contract(erc20ContactAbi as AbiItem[], addresses.erc20Contract);
    this.guardiansContract = new this.web3.eth.Contract(guardiansContractJSON.abi, addresses.guardiansContract);

    this.earliestBlockForDelegation = !isNil(options.earliestBlockForDelegation)
      ? options.earliestBlockForDelegation
      : ORBS_TDE_ETHEREUM_BLOCK;
  }

  // CONFIG //
  setFromAccount(address: string): void {
    this.votingContract.options.from = address;
  }

  // WRITE //
  selectGuardian(guardianAddress: string): PromiEvent<TransactionReceipt> {
    return this.votingContract.methods.delegate(guardianAddress).send();
  }

  // READ //
  async readSelectedGuardianAddress(accountAddress: string): Promise<string> {
    let info: IDelegationData = await this.getCurrentDelegationByDelegate(accountAddress);
    if (info.delegatedTo === NOT_DELEGATED) {
      info = await this.getCurrentDelegationByTransfer(accountAddress);
    }

    return info.delegatedTo;
  }

  async readDelegationInfo(address: string): Promise<IDelegationInfo> {
    let info: IDelegationData = await this.getCurrentDelegationByDelegate(address);
    let delegationType: TDelegationType;
    if (info.delegatedTo === NOT_DELEGATED) {
      info = await this.getCurrentDelegationByTransfer(address);
      if (info.delegatedTo === NOT_DELEGATED) {
        delegationType = 'Not-Delegated';
      } else {
        delegationType = 'Transfer';
      }
    } else {
      delegationType = 'Delegate';
    }

    const balance = await this.readOrbsBalance(address);
    return {
      delegatorBalance: Number(balance),
      delegationType,
      ...info,
    };
  }

  async readGuardiansList(offset: number, limit: number): Promise<string[]> {
    return await this.getGuardians(offset, limit);
  }

  async readGuardianInfo(guardianAddress: string): Promise<IGuardianInfo> {
    const guardianData: IGuardianData = await this.getGuardianData(guardianAddress);

    const [votingWeightResults, totalParticipatingTokens] = await Promise.all([
      this.orbsClientService.readGuardianVoteWeight(guardianAddress),
      this.orbsClientService.readTotalParticipatingTokens(),
    ]);

    const result: IGuardianInfo = {
      voted: votingWeightResults !== BigInt(0),
      stakePercent: 0,
      ...guardianData,
    };

    if (totalParticipatingTokens !== BigInt(0)) {
      result.stakePercent = Number(votingWeightResults) / Number(totalParticipatingTokens);
    }

    return result;
  }

  // Events Subscriptions //
  subscribeToDelegateEvent(
    stakeOwner: string,
    callback: (error: Error, delegator: string, delegate: string, delegationCounter: number) => void,
  ): () => Promise<boolean> {
    const specificEventEmitter = this.votingContract.events.Delegate(
      {
        filter: {
          delegator: [stakeOwner],
        },
      },
      (error: Error, event: ITypedEventData<IVotingContractDelegateEventValues>) => {
        if (error) {
          callback(error, null, null, null);
          return;
        }

        callback(
          null,
          event.returnValues.delegator,
          event.returnValues.to,
          parseInt(event.returnValues.delegationCounter),
        );
      },
    );

    return () => getUnsubscribePromise(specificEventEmitter);
  }

  ////////////////////////// PRIVATES ///////////////////////////

  private getGuardians(offset: number, limit: number): Promise<string[]> {
    return this.guardiansContract.methods.getGuardians(offset, limit).call();
  }

  private async getGuardianData(address: string): Promise<IGuardianData> {
    const [guardianData, currentVote, upcomingElectionsBlockNumber] = await Promise.all([
      this.guardiansContract.methods.getGuardianData(address).call(),
      this.votingContract.methods.getCurrentVote(address).call(),
      readUpcomingElectionBlockNumber(this.web3),
    ]);

    const votedAtBlockNumber = parseInt(currentVote.blockNumber);
    return {
      name: guardianData.name,
      website: guardianData.website,
      hasEligibleVote: votedAtBlockNumber + VALID_VOTE_LENGTH > upcomingElectionsBlockNumber,
      currentVote: currentVote.validators,
    };
  }

  private async getCurrentDelegationByDelegate(address: string): Promise<IDelegationData> {
    const from = address;

    let currentDelegation = await this.votingContract.methods.getCurrentDelegation(from).call({ from });

    if (currentDelegation === NOT_DELEGATED) {
      return {
        delegatedTo: NOT_DELEGATED,
      };
    }

    const options = {
      fromBlock: this.earliestBlockForDelegation,
      toBlock: 'latest',
      filter: {
        delegator: this.web3.utils.padLeft(address, 40, '0'),
        to: this.web3.utils.padLeft(currentDelegation, 40, '0'),
      },
    };

    const events = await this.votingContract.getPastEvents('Delegate', options);
    if (events.length === 0) {
      return {
        delegatedTo: NOT_DELEGATED,
      };
    }
    const lastEvent = events.pop();

    let { timestamp } = await this.web3.eth.getBlock(lastEvent.blockNumber);
    timestamp = ensureNumericValue(timestamp);

    return {
      delegatedTo: currentDelegation,
      delegationBlockNumber: lastEvent.blockNumber,
      delegationTimestamp: timestamp * 1000,
    };
  }

  private async readOrbsBalance(address: string): Promise<string> {
    const balance = await this.erc20Contract.methods.balanceOf(address).call();
    return this.web3.utils.fromWei(balance, 'ether');
  }

  private async getCurrentDelegationByTransfer(address: string): Promise<IDelegationData> {
    const delegationConstant = '0x00000000000000000000000000000000000000000000000000f8b0a10e470000';

    const paddedAddress = this.web3.utils.padLeft(address, 40, '0');
    const options = {
      fromBlock: this.earliestBlockForDelegation,
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
}

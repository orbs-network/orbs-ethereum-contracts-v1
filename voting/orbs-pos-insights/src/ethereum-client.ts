/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Web3 from "web3";
import contractsInfo from "./contracts-info";
import erc20ContactAbi from "./erc20-abi";
import votingContractJSON from "./contracts/OrbsVoting.json";
import orbsRewardsDistributionContractJSON from "./contracts/OrbsRewardsDistribution.json";
import guardiansContractJSON from "./contracts/OrbsGuardians.json";
import validatorsContractJSON from "./contracts/OrbsValidators.json";
import validatorsRegistryContractJSON from "./contracts/OrbsValidatorsRegistry.json";
import Contract from "web3/eth/contract";
import { BlockType } from "web3/eth/types";

const FIRST_ELECTION_BLOCK_HEIGHT = 7528900;
const INTERVAL_BETWEEN_ELECTIONS = 20000;
const VALID_VOTE_LENGTH = 45500;
const OrbsTDEEthereumBlock = 7439168;
export const NON_DELEGATED = "0x0000000000000000000000000000000000000000";

export interface IValidatorData {
  name: string;
  ipAddress: string;
  website: string;
  orbsAddress: string;
}

export interface IGuardianData {
  name: string;
  website: string;
  hasEligibleVote: boolean;
}

export interface IRewardsDistributionEvent {
  distributionEvent: string;
  amount: number;
  transactionHash: string;
}

export interface IDelegationData {
  delegatedTo: string;
  delegationBlockNumber?: number;
  delegationTimestamp?: number;
}

export class EthereumClientService {
  private web3: Web3;
  private guardiansContract: Contract;
  private votingContract: Contract;
  private orbsRewardsDistributionContract: Contract;
  private validatorsContract: Contract;
  private validatorsRegistryContract: Contract;
  private erc20Contract: Contract;

  constructor(url: string) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(url));
    this.guardiansContract = new this.web3.eth.Contract(guardiansContractJSON.abi, contractsInfo.EthereumGuardiansContract.address);
    this.votingContract = new this.web3.eth.Contract(votingContractJSON.abi, contractsInfo.EthereumVotingContract.address);
    this.orbsRewardsDistributionContract = new this.web3.eth.Contract(orbsRewardsDistributionContractJSON.abi, contractsInfo.EthereumOrbsRewardsDistributionContract.address);
    this.validatorsContract = new this.web3.eth.Contract(validatorsContractJSON.abi, contractsInfo.EthereumValidatorsContract.address);
    this.validatorsRegistryContract = new this.web3.eth.Contract(validatorsRegistryContractJSON.abi, contractsInfo.EthereumValidatorsRegistryContract.address);
    this.erc20Contract = new this.web3.eth.Contract(erc20ContactAbi, contractsInfo.EthereumErc20Address.address);
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
    const [guardianData, currentVote, nextElectionsBlockNumber] = await Promise.all([
      this.guardiansContract.methods.getGuardianData(address).call(),
      this.votingContract.methods.getCurrentVote(address).call(),
      this.getNextElectionsBlockNumber(),
    ]);

    const votedAtBlockNumber = parseInt(currentVote.blockNumber);
    return {
      name: guardianData.name,
      website: guardianData.website,
      hasEligibleVote: votedAtBlockNumber + VALID_VOTE_LENGTH > nextElectionsBlockNumber,
    };
  }

  async getCurrentDelegationByDelegate(address: string): Promise<IDelegationData> {
    const from = address;

    let currentDelegation = await this.votingContract.methods.getCurrentDelegation(from).call({ from });

    if (currentDelegation === NON_DELEGATED) {
      return {
        delegatedTo: currentDelegation,
      };
    }

    const DelegateEventSignature = this.web3.utils.sha3("Delegate(address,address,uint256)");

    const options = {
      fromBlock: OrbsTDEEthereumBlock,
      toBlock: "latest" as BlockType,
      topics: [this.web3.utils.padLeft(address, 64, "0"), this.web3.utils.padLeft(currentDelegation, 64, "0")],
    };

    const events = await this.votingContract.getPastEvents(DelegateEventSignature, options);
    const lastEvent = events.pop();

    const { timestamp } = await this.web3.eth.getBlock(lastEvent.blockNumber);

    return {
      delegatedTo: currentDelegation,
      delegationBlockNumber: lastEvent.blockNumber,
      delegationTimestamp: timestamp * 1000,
    };
  }

  async getOrbsRewardsDistribution(address: string): Promise<IRewardsDistributionEvent[]> {
    const options = {
      fromBlock: OrbsTDEEthereumBlock,
      toBlock: "latest" as BlockType,
      filter: { recipient: address },
    };

    const events = await this.orbsRewardsDistributionContract.getPastEvents("RewardDistributed", options);

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
    const TransferEventSignature = this.web3.utils.sha3("Transfer(address,address,uint256)");
    const delegationConstant = "0x00000000000000000000000000000000000000000000000000f8b0a10e470000";

    const paddedAddress = this.web3.utils.padLeft(address, 64, "0");
    const options = {
      fromBlock: OrbsTDEEthereumBlock,
      toBlock: "latest" as BlockType,
      topics: [paddedAddress],
    };

    const events = await this.erc20Contract.getPastEvents(TransferEventSignature, options);

    const entryWithTransaction = events.reverse().find(({ raw }) => raw["data"] === delegationConstant);

    if (!entryWithTransaction) {
      return {
        delegatedTo: NON_DELEGATED,
      };
    }
    
    const { timestamp } = await this.web3.eth.getBlock(entryWithTransaction.blockNumber);
    const help = entryWithTransaction["raw"]["topics"][2];

    return {
      delegatedTo: "0x" + help.substring(26, 66),
      delegationBlockNumber: entryWithTransaction.blockNumber,
      delegationTimestamp: timestamp * 1000,
    };
  }

  async getNextElectionsBlockNumber(): Promise<number> {
    let amountOfElections = 0;
    let nextElectionsBlockNumber = 0;
    const currentBlockNumber = await this.web3.eth.getBlockNumber();
    while (nextElectionsBlockNumber < currentBlockNumber) {
      amountOfElections += 1;
      nextElectionsBlockNumber = FIRST_ELECTION_BLOCK_HEIGHT + INTERVAL_BETWEEN_ELECTIONS * amountOfElections;
    }
    return nextElectionsBlockNumber;
  }

  async getOrbsBalance(address: string): Promise<string> {
    const balance = await this.erc20Contract.methods.balanceOf(address).call();
    return this.web3.utils.fromWei(balance, "ether");
  }
}

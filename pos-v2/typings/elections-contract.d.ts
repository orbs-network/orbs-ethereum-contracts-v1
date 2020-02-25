import {Contract} from "../eth";
import {TransactionConfig, TransactionReceipt} from "web3-core";
import * as BN from "bn.js";

export interface ElectionsContract extends Contract {
  registerValidator( ip: string, orbsAddrs: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  stakeChange(stakeOwner: string, amount: number, sign: boolean, updatedStake: number, params?: TransactionConfig): Promise<TransactionReceipt>;
  stakeChangeBatch(stakeOwners: string[], amounts: number[], signs: boolean[], updatedStakes: number[])
  delegate( to: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  getTopology(): Promise<TransactionReceipt>;
  notifyReadyForCommittee( params?: TransactionConfig): Promise<TransactionReceipt>;
  voteOut(address: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  setValidatorOrbsAddress(orbsAddress: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  setValidatorIp(ip: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  refreshStakes(addrs: string[], params?: TransactionConfig): Promise<TransactionReceipt>;
  setContractRegistry(contractRegistry: string, params?: TransactionConfig): Promise<TransactionReceipt>;
}

export interface DelegatedEvent {
  from: string;
  to: string;
}

export interface CommitteeChangedEvent {
  addrs: string[];
  orbsAddrs: string[];
  stakes: (number | BN)[];
}

export interface TopologyChangedEvent {
  orbsAddrs: string[];
  ips: string[];
}

export interface ValidatorRegisteredEvent {
  addr: string;
  ip: string;
}

export interface TotalStakeChangedEvent {
  addr: string;
  newTotal: number | BN;
}

export interface VoteOutEvent {
  voter: string;
  against: string;
}

export interface VotedOutOfCommitteeEvent {
  addr: string;
}

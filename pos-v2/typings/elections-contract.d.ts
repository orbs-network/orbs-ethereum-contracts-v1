import { Contract } from "./contract";
import TransactionDetails = Truffle.TransactionDetails;
import TransactionResponse = Truffle.TransactionResponse;

export interface ElectionsContract extends Contract {
  registerValidator( ip: string, orbsAddrs: string, params?: TransactionDetails): Promise<TransactionResponse>;
  stakeChange(stakeOwner: string, amount: number, sign: boolean, updatedStake: number, params?: TransactionDetails): Promise<TransactionResponse>;
  stakeChangeBatch(stakeOwners: string[], amounts: number[], signs: boolean[], updatedStakes: number[])
  delegate( to: string, params?: TransactionDetails): Promise<TransactionResponse>;
  getTopology(): Promise<TransactionResponse>;
  notifyReadyForCommittee( params?: TransactionDetails): Promise<TransactionResponse>;
  voteOut(address: string, params?: TransactionDetails): Promise<TransactionResponse>;
  setValidatorOrbsAddress(orbsAddress: string, params?: TransactionDetails): Promise<TransactionResponse>;
  setValidatorIp(ip: string, params?: TransactionDetails): Promise<TransactionResponse>;
  refreshStakes(addrs: string[], params?: TransactionDetails): Promise<TransactionResponse>;
  setContractRegistry(contractRegistry: string, params?: TransactionDetails): Promise<TransactionResponse>;
  setBanningVotes(address: string[], params?: TransactionDetails): Promise<TransactionResponse>;
  refreshBanningVote(voter: string, against: string, params?: TransactionDetails): Promise<TransactionResponse>;
  getBanningVotes(address: string): Promise<string[]>;
  getTotalGovernanceStake(): Promise<BN>;
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

export interface StakeChangeEvent {
  addr: string;
  ownStake: number | BN;
  uncappedStake: number | BN;
  governanceStake: number | BN;
  committeeStake: number | BN;
}

export interface VoteOutEvent {
  voter: string;
  against: string;
}

export interface VotedOutOfCommitteeEvent {
  addr: string;
}

export interface BanningVoteEvent {
  voter: string;
  against: string[];
}

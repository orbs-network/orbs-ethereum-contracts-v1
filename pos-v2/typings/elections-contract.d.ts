import { Contract } from "./contract";
import TransactionDetails = Truffle.TransactionDetails;
import TransactionResponse = Truffle.TransactionResponse;

export interface ElectionsContract extends Contract {
  registerValidator( ip: string, orbsAddrs: string, params?: TransactionDetails): Promise<TransactionResponse>;
  staked( stakeOwner: string, amount: number, params?: TransactionDetails): Promise<TransactionResponse>;
  unstaked( stakeOwner: string, amount: number, params?: TransactionDetails): Promise<TransactionResponse>;
  delegate( to: string, params?: TransactionDetails): Promise<TransactionResponse>;
  getTopology(): Promise<TransactionResponse>;
  notifyReadyForCommittee( params?: TransactionDetails): Promise<TransactionResponse>;
  voteOut(address: string, params?: TransactionDetails): Promise<TransactionResponse>;
  setValidatorOrbsAddress(orbsAddress: string, params?: TransactionDetails): Promise<TransactionResponse>;
  setValidatorIp(ip: string, params?: TransactionDetails): Promise<TransactionResponse>;
  refreshStakes(addrs: string[], params?: TransactionDetails): Promise<TransactionResponse>;
  setContractRegistry(contractRegistry: string, params?: TransactionDetails): Promise<TransactionResponse>;
  voteForBanning(address: string, params?: TransactionDetails): Promise<TransactionResponse>;
  unvoteForBanning(address: string, params?: TransactionDetails): Promise<TransactionResponse>;
  refreshBanningVote(voter: string, against: string, params?: TransactionDetails): Promise<TransactionResponse>;
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

export interface BanningVoteEvent {
  voter: string;
  against: string;
}

export interface BanningUnvoteEvent {
  voter: string;
  against: string;
}

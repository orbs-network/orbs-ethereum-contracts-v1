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

export const NOT_DELEGATED = "0x0000000000000000000000000000000000000000";

export interface IEthereumClientService {
  getValidators(): Promise<string[]>;
  getValidatorData(address: string): Promise<IValidatorData>;
  getGuardians(offset: number, limit: number): Promise<string[]>;
  getGuardianData(address: string): Promise<IGuardianData>;
  getCurrentDelegationByDelegate(address: string): Promise<IDelegationData>;
  getOrbsRewardsDistribution(address: string): Promise<IRewardsDistributionEvent[]>;
  getCurrentDelegationByTransfer(address: string): Promise<IDelegationData>;
  getUpcomingElectionBlockNumber(): Promise<number>;
  getOrbsBalance(address: string): Promise<string>;
}

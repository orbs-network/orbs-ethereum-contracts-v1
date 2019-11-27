import { IDelegationData } from "./IDelegationData";
import { IGuardianData } from "./IGuardianData";
import { IRewardsDistributionEvent } from "./IRewardsDistributionEvent";
import { IValidatorData } from "./IValidatorData";

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
  subscribeToORBSBalanceChange(address: string, callback: (orbsBalance: string) => void): Promise<() => void>;
}

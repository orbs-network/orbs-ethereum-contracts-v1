import { IRewardsDistributionEvent } from './IRewardsDistributionEvent';
import { IValidatorData } from './IValidatorData';

export interface IEthereumClientService {
  getValidators(): Promise<string[]>;
  getValidatorData(address: string): Promise<IValidatorData>;
  getOrbsRewardsDistribution(address: string): Promise<IRewardsDistributionEvent[]>;
  getUpcomingElectionBlockNumber(): Promise<number>;
  getOrbsBalance(address: string): Promise<string>;
  subscribeToORBSBalanceChange(address: string, callback: (orbsBalance: string) => void): () => void;
}

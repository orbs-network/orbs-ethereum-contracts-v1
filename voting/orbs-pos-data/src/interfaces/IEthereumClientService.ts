import { IRewardsDistributionEvent } from './IRewardsDistributionEvent';
import { IValidatorData } from './IValidatorData';

export interface IEthereumClientService {
  readValidators(): Promise<string[]>;
  readValidatorData(address: string): Promise<IValidatorData>;
  readOrbsRewardsDistribution(address: string): Promise<IRewardsDistributionEvent[]>;
  readUpcomingElectionBlockNumber(): Promise<number>;
  readOrbsBalance(address: string): Promise<string>;
  subscribeToORBSBalanceChange(address: string, callback: (orbsBalance: string) => void): () => void;
}

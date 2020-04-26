import { IRewardsDistributionEvent } from './IRewardsDistributionEvent';
import { IValidatorData } from './IValidatorData';

export interface IEthereumClientService {
  readValidators(): Promise<string[]>;
  readValidatorData(address: string): Promise<IValidatorData>;

  /**
   * @deprecated Please use the 'rewards service'
   */
  readOrbsRewardsDistribution(address: string): Promise<IRewardsDistributionEvent[]>;
  readUpcomingElectionBlockNumber(): Promise<number>;
  readOrbsBalance(address: string): Promise<bigint>;
  subscribeToORBSBalanceChange(address: string, callback: (orbsBalance: bigint) => void): () => void;
}

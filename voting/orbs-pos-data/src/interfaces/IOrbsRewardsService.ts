import { IRewardsDistributionEvent } from './IRewardsDistributionEvent';
import { IAccumulatedRewards } from './IAccumulatedRewards';

export interface IOrbsRewardsService {
  readAccumulatedRewards(address: string): Promise<IAccumulatedRewards>;
  readRewardsDistributionsHistory(address: string): Promise<IRewardsDistributionEvent[]>;
}

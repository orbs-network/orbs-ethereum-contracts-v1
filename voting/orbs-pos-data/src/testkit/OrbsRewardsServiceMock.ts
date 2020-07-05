import { IElectedValidatorInfo } from '../interfaces/IElectedValidatorInfo';
import { IOrbsPOSDataService } from '../interfaces/IOrbsPOSDataService';
import { IRewards } from '../interfaces/IRewards';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import { IValidatorInfo } from '../interfaces/IValidatorInfo';
import { IOrbsRewardsService } from '../interfaces/IOrbsRewardsService';
import { IAccumulatedRewards } from '../interfaces/IAccumulatedRewards';

export class OrbsRewardsServiceMock implements IOrbsRewardsService {
  private accumulatedRewardsMap: Map<string, IAccumulatedRewards> = new Map();
  private rewardsDistributionsEventsMap: Map<string, IRewardsDistributionEvent[]> = new Map();

  public async readAccumulatedRewards(address: string): Promise<IAccumulatedRewards> {
    if (!this.accumulatedRewardsMap.has(address)) {
      return {
        validatorReward: 0n,
        guardianReward: 0n,
        delegatorReward: 0n,
      };
    }

    return this.accumulatedRewardsMap.get(address);
  }

  public async readRewardsDistributionsHistory(address: string): Promise<IRewardsDistributionEvent[]> {
    if (!this.rewardsDistributionsEventsMap.has(address)) {
      return []
    }

    return this.rewardsDistributionsEventsMap.get(address);
  }

  // Test helpers //

  public withAccumulatedRewards(address: string, accumulatedRewards: IAccumulatedRewards) {
    this.accumulatedRewardsMap.set(address, accumulatedRewards);
  }

  public withRewardsDistributionHistory(address: string, rewardsDistributionEvents: IRewardsDistributionEvent[]) {
    this.rewardsDistributionsEventsMap.set(address, rewardsDistributionEvents);
  }
}

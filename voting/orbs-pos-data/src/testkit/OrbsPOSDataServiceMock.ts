import { IElectedValidatorInfo } from '../interfaces/IElectedValidatorInfo';
import { IOrbsPOSDataService } from '../interfaces/IOrbsPOSDataService';
import { IRewards } from '../interfaces/IRewards';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import { IValidatorInfo } from '../interfaces/IValidatorInfo';

export class OrbsPOSDataServiceMock implements IOrbsPOSDataService {
  private orbsBalanceMap: Map<string, bigint> = new Map();
  private orbsBalanceChangeCallback: (newBalance: string) => void;
  private totalTokens: bigint;

  async readValidators(): Promise<string[]> {
    return [];
  }

  async readValidatorInfo(validatorAddress: string): Promise<IValidatorInfo> {
    return null;
  }

  async readTotalParticipatingTokens(): Promise<number> {
    return Number(this.totalTokens);
  }

  async readRewards(address: string): Promise<IRewards> {
    return null;
  }

  async readRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]> {
    return [];
  }

  async readUpcomingElectionBlockNumber(): Promise<number> {
    return 0;
  }

  async readEffectiveElectionBlockNumber(): Promise<number> {
    return 0;
  }

  async readElectedValidators(): Promise<string[]> {
    return [];
  }

  async readElectedValidatorInfo(validatorAddress: string): Promise<IElectedValidatorInfo> {
    return null;
  }

  async readOrbsBalance(address: string): Promise<string> {
    const resultBigInt = this.orbsBalanceMap.get(address);
    return resultBigInt ? resultBigInt.toString() : '0';
  }

  subscribeToORBSBalanceChange(address: string, callback: (newBalance: string) => void): () => void {
    this.orbsBalanceChangeCallback = callback;
    return () => (this.orbsBalanceChangeCallback = null);
  }

  // Test helpers
  withTotalParticipatingTokens(totalTokens: bigint): this {
    this.totalTokens = totalTokens;
    return this;
  }

  withORBSBalance(address: string, newBalance: bigint): this {
    this.orbsBalanceMap.set(address, newBalance);
    return this;
  }

  fireORBSBalanceChange(newBalance: string): this {
    if (this.orbsBalanceChangeCallback) {
      this.orbsBalanceChangeCallback(newBalance);
    }
    return this;
  }
}

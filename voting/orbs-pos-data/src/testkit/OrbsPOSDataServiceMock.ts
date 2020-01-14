import { IElectedValidatorInfo } from '../interfaces/IElectedValidatorInfo';
import { IOrbsPOSDataService } from '../interfaces/IOrbsPOSDataService';
import { IRewards } from '../interfaces/IRewards';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import { IValidatorInfo } from '../interfaces/IValidatorInfo';

export class OrbsPOSDataServiceMock implements IOrbsPOSDataService {
  private orbsBalanceMap: Map<string, bigint> = new Map();
  private orbsBalanceChangeCallback: (newBalance: string) => void;
  private totalTokens: bigint;

  async getValidators(): Promise<string[]> {
    return [];
  }

  async getValidatorInfo(validatorAddress: string): Promise<IValidatorInfo> {
    return null;
  }

  async getTotalParticipatingTokens(): Promise<number> {
    return Number(this.totalTokens);
  }

  async getRewards(address: string): Promise<IRewards> {
    return null;
  }

  async getRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]> {
    return [];
  }

  async getUpcomingElectionBlockNumber(): Promise<number> {
    return 0;
  }

  async getEffectiveElectionBlockNumber(): Promise<number> {
    return 0;
  }

  async getElectedValidators(): Promise<string[]> {
    return [];
  }

  async getElectedValidatorInfo(validatorAddress: string): Promise<IElectedValidatorInfo> {
    return null;
  }

  async getOrbsBalance(address: string): Promise<string> {
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

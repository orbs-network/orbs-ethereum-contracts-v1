import { IOrbsPOSDataService } from '../interfaces/IOrbsPOSDataService';
import { IRewards } from '../interfaces/IRewards';
import { IGuardianInfo } from '../interfaces/IGuardianInfo';
import { IDelegationInfo } from '../interfaces/IDelegationInfo';
import { IElectedValidatorInfo } from '../interfaces/IElectedValidatorInfo';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import { IValidatorInfo } from '../interfaces/IValidatorInfo';

export class OrbsPOSDataServiceMock implements IOrbsPOSDataService {
  private guardiansList: string[] = [];
  private guardiansMap: Map<string, IGuardianInfo> = new Map();
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

  async getGuardiansList(offset: number, limit: number): Promise<string[]> {
    return this.guardiansList;
  }

  async getGuardianInfo(guardianAddress: string): Promise<IGuardianInfo> {
    return this.guardiansMap.get(guardianAddress);
  }

  async getUpcomingElectionBlockNumber(): Promise<number> {
    return 0;
  }

  async getEffectiveElectionBlockNumber(): Promise<number> {
    return 0;
  }

  async getDelegatee(address: string): Promise<string> {
    return '';
  }

  async getDelegationInfo(address: string): Promise<IDelegationInfo> {
    return null;
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
  withGuardian(address: string, guardian: IGuardianInfo): this {
    this.guardiansList.push(address);
    this.guardiansMap.set(address, guardian);
    return this;
  }

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

import { IOrbsPOSDataService } from "../interfaces/IOrbsPOSDataService";
import { IRewards } from '../interfaces/IRewards';
import { IGuardianInfo } from '../interfaces/IGuardianInfo';
import { IDelegationInfo } from '../interfaces/IDelegationInfo';
import { IElectedValidatorInfo } from '../interfaces/IElectedValidatorInfo';
import { IRewardsDistributionEvent } from '../interfaces/IRewardsDistributionEvent';
import { IValidatorInfo } from '../interfaces/IValidatorInfo';

export class OrbsPOSDataServiceMock implements IOrbsPOSDataService {
  private guardiansList: string[] = [];
  private guardiansMap: Map<string, IGuardianInfo> = new Map();

  async getValidators(): Promise<string[]> {
    return [];
	}
	
  async getValidatorInfo(validatorAddress: string): Promise<IValidatorInfo> {
    return null;
	}
	
  async getTotalParticipatingTokens(): Promise<number> {
    return 0;
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
    return "";
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
    return '0';
  }

  // Test helpers
  withGuardian(address: string, guardian: IGuardianInfo): this {
    this.guardiansList.push(address);
    this.guardiansMap.set(address, guardian);
    return this;
  }
}

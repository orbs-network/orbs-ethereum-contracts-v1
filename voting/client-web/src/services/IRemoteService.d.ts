import { IGuardianData } from './IGuardianData';
import { IValidatorData } from './IValidatorData';

export interface IRemoteService {
  getGuardians(): Promise<string[]>;
  getGuardianData(address: string): Promise<IGuardianData>;
  getValidators(): Promise<string[]>;
  getElectedValidators(): Promise<string[]>;
  getValidatorData(address: string): Promise<IValidatorData>;
  getElectedValidatorData(address: string): Promise<{}>;
  getRewards(address: string): Promise<any>;
  getRewardsHistory(address: string): Promise<any>;
  getTotalStake(): Promise<string>;
  getNextElectionBlockHeight(): Promise<string>;
  getPastElectionBlockHeight(): Promise<string>;
  getCurrentDelegation(address: string): Promise<string>;
  getCurrentDelegationInfo(address: string): Promise<{}>;
}

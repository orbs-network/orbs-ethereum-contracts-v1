import { IRemoteService, TCurrentDelegationInfo, TRewardsSummary } from './IRemoteService';
import { IElectedValidatorData } from './IValidatorData';

export class RemoteServiceMock implements IRemoteService {
  constructor(private guardians, private validators) {}

  getGuardians() {
    return Promise.resolve(Object.keys(this.guardians));
  }
  getGuardianData(address) {
    return Promise.resolve(this.guardians[address]);
  }
  getValidators() {
    return Promise.resolve(Object.keys(this.validators));
  }
  getValidatorData(address) {
    return Promise.resolve(this.validators[address]);
  }
  getElectedValidators() {
    return Promise.resolve([]);
  }
  getElectedValidatorData() {
    const mockElectedValidatorData: IElectedValidatorData = {
      ipAddress: '',
      name: '',
      orbsAddress: '',
      stake: 0,
      website: '',
    };

    return Promise.resolve(mockElectedValidatorData);
  }
  getRewards() {
    // TODO : O.L : We only added the 'as type' to appease TS, we should check if the test is still valid.
    const mock: TRewardsSummary = {} as TRewardsSummary;
    return Promise.resolve(mock);
  }
  getRewardsHistory(address: string) {
    return Promise.resolve([]);
  }
  getTotalParticipatingTokens() {
    return Promise.resolve('totally-fake-stake');
  }
  getCurrentDelegation() {
    return Promise.resolve('');
  }
  getCurrentDelegationInfo(address: string) {
    // TODO : O.L : We only added the 'as type' to appease TS, we should check if the test is still valid.
    const mock: TCurrentDelegationInfo = {} as TCurrentDelegationInfo;
    return Promise.resolve(mock);
  }
  getUpcomingElectionBlockNumber() {
    return Promise.resolve('0');
  }
  getEffectiveElectionBlockNumber() {
    return Promise.resolve('0');
  }
}

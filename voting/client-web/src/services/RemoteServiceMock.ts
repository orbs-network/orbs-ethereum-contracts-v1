import { IRemoteService } from './IRemoteService';

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
    return Promise.resolve({});
  }
  getRewards() {
    return Promise.resolve({});
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
  getCurrentDelegationInfo() {
    return Promise.resolve({});
  }
  getUpcomingElectionBlockNumber() {
    return Promise.resolve('0');
  }
  getPastElectionBlockNumber() {
    return Promise.resolve('0');
  }
}

import { IApiStrategy, Mode } from './interface';

export class ApiStrategyStub implements IApiStrategy {
  mode = Mode.ReadWrite;
  constructor(private guardians, private validators) {}
  getCurrentAddress() {
    return Promise.resolve('some-fake-addreess');
  }
  delegate(address) {
    return Promise.resolve(address);
  }
  voteOut(addresses) {
    return Promise.resolve(addresses);
  }
  getGuardians() {
    return Promise.resolve(Object.keys(this.guardians));
  }
  getGuardianData(address) {
    return Promise.resolve(this.guardians[address]);
  }
  registerGuardian() {
    return Promise.resolve(true);
  }
  getValidators() {
    return Promise.resolve(Object.keys(this.validators));
  }
  getValidatorData(address) {
    return Promise.resolve(this.validators[address]);
  }
  registerValidator() {
    return Promise.resolve(true);
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
  getTotalStake() {
    return Promise.resolve('totally-fake-stake');
  }
  getCurrentDelegation() {
    return Promise.resolve('');
  }
  getLastVote() {
    return Promise.resolve({ validators: [] });
  }
}

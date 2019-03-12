import { IApiStrategy, Strategies } from './interface';

export class RemoteStrategy implements IApiStrategy {
  type = Strategies.remote;
  getGuardians() {
    return Promise.resolve(['1', '2']);
  }
  getGuardianData(address) {
    return Promise.resolve({ name: 'test', website: 'https://test.com' });
  }
  getValidators() {
    return Promise.resolve(['1', '2']);
  }
  getValidatorData(address) {
    return Promise.resolve({ name: 'test', website: 'https://test.com' });
  }
}

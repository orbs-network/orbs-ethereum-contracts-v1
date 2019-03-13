import { IApiStrategy, Mode } from './interface';
import { RemoteService } from '../services/remote';
import { MetamaskService } from '../services/metamask';

export class ApiService implements IApiStrategy {
  private metamask: MetamaskService = new MetamaskService();
  private remote: RemoteService = new RemoteService();

  mode: Mode = window['ethereum'] ? Mode.ReadWrite : Mode.ReadOnly;

  getCurrentAddress() {
    return this.metamask.getCurrentAddress();
  }
  delegate(address: string) {
    return this.metamask.delegate(address);
  }
  voteOut(addresses: string[]) {
    return this.metamask.voteOut(addresses);
  }
  getGuardians() {
    return this.remote.getGuardians(0, 100);
  }
  getGuardianData(address: string) {
    return this.remote.getGuardianData(address);
  }
  registerGuardian(info) {
    return this.metamask.registerGuardian(info);
  }
  getValidators() {
    return this.remote.getValidators();
  }
  getValidatorData(address: string) {
    return this.remote.getValidatorData(address);
  }
  registerValidator(info) {
    return this.metamask.registerValidator(info);
  }
}

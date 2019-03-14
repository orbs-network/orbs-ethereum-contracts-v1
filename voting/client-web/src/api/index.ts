import { IApiStrategy, Mode } from './interface';
import { RemoteService } from '../services/remote';
import { MetamaskService } from '../services/metamask';
import { MetamaskServiceStub } from '../services/metamask-stub';

export class ApiService implements IApiStrategy {
  private metamask;
  private remote;
  mode: Mode;

  constructor() {
    this.mode = window['ethereum'] ? Mode.ReadWrite : Mode.ReadOnly;
    this.remote = new RemoteService();
    this.metamask =
      this.mode === Mode.ReadWrite
        ? new MetamaskService()
        : new MetamaskServiceStub();
  }

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

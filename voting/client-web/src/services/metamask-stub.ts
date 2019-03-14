import { stubWarning } from '../decorators/stub-warning';

export class MetamaskServiceStub {
  @stubWarning()
  getCurrentAddress() {
    return '';
  }

  @stubWarning()
  delegate() {
    return Promise.reject();
  }

  @stubWarning()
  voteOut() {
    return Promise.reject();
  }

  @stubWarning()
  registerGuardian() {
    return Promise.reject();
  }

  @stubWarning()
  registerValidator() {
    return Promise.reject();
  }
}

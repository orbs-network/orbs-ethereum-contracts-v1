export class MetamaskServiceStub {
  getCurrentAddress() {
    console.warn(
      'Method "getCurrentAddress" is not available in read-only mode'
    );
    return Promise.resolve('');
  }

  delegate() {
    console.warn('Method "delegate" is not available in read-only mode');
    return Promise.reject();
  }

  voteOut() {
    console.warn('Method "voteOut" is not available in read-only mode');
    return Promise.reject();
  }

  registerGuardian() {
    console.warn(
      'Method "registerGuardian" is not available in read-only mode'
    );
    return Promise.reject();
  }

  registerValidator() {
    console.warn(
      'Method "registerValidator" is not available in read-only mode'
    );
    return Promise.reject();
  }

  getCurrentDelegation() {
    console.warn(
      'Method "getCurrentDelegation" is not available in read-only mode'
    );
    return Promise.reject();
  }
  getLastVote() {
    console.warn('Method "getLastVote" is not available in read-only mode');
    return Promise.reject();
  }
  isMainNet() {
    return true;
  }
}

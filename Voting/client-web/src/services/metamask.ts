export default class MetamaskService {
  enable() {
    return ethereum
      .enable()
      .then(
        (addresses: string[]) => addresses[0],
        (err: any) => Promise.reject(err)
      );
  }
  getCurrentAddress() {
    return ethereum.selectedAddress;
  }
}

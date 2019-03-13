import * as Orbs from 'orbs-client-sdk/dist';

const virtualChainId = 2020;
const orbsNodeUrl = `http://3.122.219.67/vchains/${virtualChainId}`;

export class OrbsApi {
  private orbsAccount;
  private orbsClient;

  constructor() {
    this.orbsClient = new Orbs.Client(
      orbsNodeUrl,
      virtualChainId,
      Orbs.NetworkType.NETWORK_TYPE_TEST_NET
    );
    this.orbsAccount = Orbs.createAccount();
  }

  getBalance(address) {
    const query = this.orbsClient.createQuery(
      this.orbsAccount.publicKey,
      'BenchmarkToken',
      'getBalance',
      [Orbs.argAddress(address.toLowerCase())]
    );
    return this.orbsClient.sendQuery(query);
  }
}

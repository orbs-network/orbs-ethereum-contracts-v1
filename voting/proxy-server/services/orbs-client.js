const Orbs = require('orbs-client-sdk');
const contractsInfo = require('../contracts-info');

class OrbsClientService {
  constructor(nodeAddress, virtualChainId) {
    const orbsNodeUrl = `http://${nodeAddress}/vchains/${virtualChainId}`;
    this.orbsClient = new Orbs.Client(
      orbsNodeUrl,
      virtualChainId,
      Orbs.NetworkType.NETWORK_TYPE_TEST_NET
    );
    this.orbsAccount = Orbs.createAccount();
  }

  buildQuery(methodName, args) {
    return this.orbsClient.createQuery(
      this.orbsAccount.publicKey,
      contractsInfo.OrbsVotingContract.name,
      methodName,
      args
    );
  }

  async sendQuery(query) {
    const results = await this.orbsClient.sendQuery(query);
    return results.outputArguments[0].value;
  }

  getTotalStake() {
    const query = this.buildQuery('getTotalStake', []);
    return this.sendQuery(query);
  }

  getGuardianVoteWeight(address) {
    const query = this.buildQuery('getGuardianVotingWeight', [
      Orbs.argAddress(address.toLowerCase())
    ]);
    return this.sendQuery(query);
  }

  getValidatorVotes(address) {
    const query = this.buildQuery('getValidValidatorVote', [
      Orbs.argAddress(address.toLowerCase())
    ]);
    return this.sendQuery(query);
  }
}

module.exports = {
  OrbsClientService
};

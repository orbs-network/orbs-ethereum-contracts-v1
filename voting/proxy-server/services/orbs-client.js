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

  async getTotalStake() {
    const totalStakeQuery = this.orbsClient.createQuery(
      this.orbsAccount.publicKey,
      contractsInfo.OrbsVotingContract.name,
      'getTotalStake',
      []
    );
    const totalStakeResults = await this.orbsClient.sendQuery(totalStakeQuery);
    return totalStakeResults.outputArguments[0].value;
  }

  async getGuardianVoteWeight(address) {
    const votingWeightQuery = this.orbsClient.createQuery(
      this.orbsAccount.publicKey,
      contractsInfo.OrbsVotingContract.name,
      'getGuardianVotingWeight',
      [Orbs.argAddress(address.toLowerCase())]
    );
    const votingWeightResults = await this.orbsClient.sendQuery(
      votingWeightQuery
    );
    return votingWeightResults.outputArguments[0].value;
  }
}

module.exports = {
  OrbsClientService
};

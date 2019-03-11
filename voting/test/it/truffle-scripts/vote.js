const votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
const activistAccount = process.env.ACTIVIST_ACCOUNT_INDEX_ON_ETHEREUM;
const candiatesStr = process.env.CANDIDATE_ACCOUNT_INDEXES_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!votingContractAddress) {
      throw("missing env variable VOTING_CONTRACT_ADDRESS");
    }

    if (!activistAccount) {
      throw("missing env variable ACTIVIST_ACCOUNT_INDEX_ON_ETHEREUM");
    }

    if (!candiatesStr) {
      throw("missing env variable CANDIDATE_ACCOUNT_INDEXES_ON_ETHEREUM");
    }

    const votingInstance = await artifacts.require('IOrbsVoting').at(votingContractAddress);

    let accounts = await web3.eth.getAccounts();
    let candidateIndexes = JSON.parse(candiatesStr);
    let candidates = candidateIndexes.map(elem => accounts[elem]);
    console.log(`from ${accounts[activistAccount]}(ind: ${activistAccount}) to ${candidates}(ind: ${candiatesStr})`);
    await votingInstance.voteOut(candidates, {from: accounts[activistAccount]}).on("transactionHash", hash => {
      console.error("TxHash: " + hash);
    });

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

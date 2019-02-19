const votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
const userAccountFrom = process.env.FROM_ACCOUNT_INDEX_ON_ETHEREUM;
const userAccountTo = process.env.TO_ACCOUNT_INDEX_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!votingContractAddress) {
      throw("missing env variable VOTING_CONTRACT_ADDRESS");
    }

    if (!userAccountFrom) {
      throw("missing env variable FROM_ACCOUNT_INDEX_ON_ETHEREUM");
    }

    if (!userAccountTo) {
      throw("missing env variable TO_ACCOUNT_INDEX_ON_ETHEREUM");
    }

    const votingInstance = await artifacts.require('Voting').at(votingContractAddress);

    let accounts = await web3.eth.getAccounts();
    console.log(`from ${accounts[userAccountFrom]}(ind: ${userAccountFrom}) to ${accounts[userAccountTo]}(ind: ${userAccountTo})`);
    await votingInstance.delegate(accounts[userAccountTo], {from: accounts[userAccountFrom]}).on("transactionHash", hash => {
      console.error("TxHash: " + hash);
    });

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

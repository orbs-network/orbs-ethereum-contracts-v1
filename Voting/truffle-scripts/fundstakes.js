const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const userAccountOnEthereumIndex = process.env.USER_ACCOUNT_INDEX_ON_ETHEREUM;
const userInitialBalanceOnEthereum = process.env.USER_INITIAL_BALANCE_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!userAccountOnEthereumIndex) {
      throw("missing env variable USER_ACCOUNT_ON_ETHEREUM_INDEX");
    }

    if (!userInitialBalanceOnEthereum) {
      throw("missing env variable USER_INITIAL_BALANCE_ON_ETHEREUM");
    }

    const ercToken = artifacts.require('TestingERC20');
    const instance = await ercToken.at(erc20ContractAddress);

    let accounts = await web3.eth.getAccounts();
    let userAccountOnEthereum = accounts[userAccountOnEthereumIndex];
    await instance.assign(userAccountOnEthereum, userInitialBalanceOnEthereum, {from: userAccountOnEthereum}).on("transactionHash", hash => {
      console.error("TxHash: " + hash);
    });

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

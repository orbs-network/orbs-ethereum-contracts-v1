const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const userAccountOnEthereum = process.env.USER_ACCOUNT_ON_ETHEREUM;
const userInitialBalanceOnEthereum = process.env.USER_INITIAL_BALANCE_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!userAccountOnEthereum) {
      throw("missing env variable USER_ACCOUNT_ON_ETHEREUM");
    }

    if (!userInitialBalanceOnEthereum) {
      throw("missing env variable USER_INITIAL_BALANCE_ON_ETHEREUM");
    }

    const Tet = artifacts.require('Tet.sol');
    const instance = await Tet.at(erc20ContractAddress);

    await instance.assign(userAccountOnEthereum, userInitialBalanceOnEthereum, {from: userAccountOnEthereum}).on("transactionHash", hash => {
      console.error("TxHash: " + hash);
    });
    
    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

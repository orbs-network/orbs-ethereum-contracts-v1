const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const userAccountOnEthereum = process.env.USER_ACCOUNT_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!userAccountOnEthereum) {
      throw("missing env variable USER_ACCOUNT_ON_ETHEREUM");
    }

    const Tet = artifacts.require('Tet.sol');
    const instance = await Tet.at(erc20ContractAddress);

    let balance = await instance.balanceOf(userAccountOnEthereum, {from: userAccountOnEthereum});

    console.log(JSON.stringify({
      Balance: balance
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

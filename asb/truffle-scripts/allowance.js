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

    const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
    let asbInstance = await AutonomousSwapBridge.deployed();

    const Tet = artifacts.require('Tet.sol');
    let tetInstance = await Tet.at(erc20ContractAddress);

    let allowance = await tetInstance.allowance(userAccountOnEthereum, asbInstance.address, {from: userAccountOnEthereum});

    console.log(JSON.stringify({
      Allowance: allowance
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

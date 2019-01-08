const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const userAccountOnEthereum = process.env.USER_ACCOUNT_ON_ETHEREUM;
const userTransferAmount = process.env.USER_TRANSFER_AMOUNT;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!userAccountOnEthereum) {
      throw("missing env variable USER_ACCOUNT_ON_ETHEREUM");
    }

    if (!userTransferAmount) {
      throw("missing env variable USER_TRANSFER_AMOUNT");
    }

    const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
    let asbInstance = await AutonomousSwapBridge.deployed();

    const Tet = artifacts.require('Tet.sol');
    let tetInstance = await Tet.at(erc20ContractAddress);

    await tetInstance.approve(asbInstance.address, userTransferAmount, {from: userAccountOnEthereum}).on("transactionHash", hash => {
      console.error("TxHash: " + hash);
    });

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

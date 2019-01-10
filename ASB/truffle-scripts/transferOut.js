const userAccountOnEthereum = process.env.USER_ACCOUNT_ON_ETHEREUM;
const userAccountOnOrbs = process.env.USER_ACCOUNT_ON_ORBS;
const userTransferAmount = process.env.USER_TRANSFER_AMOUNT;

module.exports = async function(done) {
  try {

    if (!userAccountOnEthereum) {
      throw("missing env variable USER_ACCOUNT_ON_ETHEREUM");
    }

    if (!userAccountOnOrbs) {
      throw("missing env variable USER_ACCOUNT_ON_ORBS");
    }

    if (!userTransferAmount) {
      throw("missing env variable USER_TRANSFER_AMOUNT");
    }

    const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
    let instance = await AutonomousSwapBridge.deployed();

    let response = await instance.transferOut(userAccountOnOrbs, userTransferAmount, {from: userAccountOnEthereum});

    console.log(JSON.stringify({
      TxHash: response.tx,
      Logs: response.receipt.logs,
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

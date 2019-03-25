const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const stakesStr = process.env.ACCOUNT_STAKES_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!stakesStr) {
      throw("missing env variable ACCOUNT_STAKES_ON_ETHEREUM");
    }

    const tokenInstance = await artifacts.require('TestingERC20').at(erc20ContractAddress);

    let accounts = await web3.eth.getAccounts();
    let stakes = JSON.parse(stakesStr);
    let indexToAddressMap = []
    let txs = [];
    for(let i = 0;i < stakes.length;i++) {
      txs.push(tokenInstance.assign(accounts[i], web3.utils.toBN(stakes[i])/*, {from: accounts[i]}*/)
          .on("transactionHash", hash => {console.error("TxHash: " + hash);}
      ));
      indexToAddressMap.push({Index: i, Address: accounts[i]});
    }

    await Promise.all(txs);

    console.log(JSON.stringify(indexToAddressMap, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

const guardiansContractAddress = process.env.GUARDIANS_CONTRACT_ADDRESS;
const guardianAccountIndexesOnEthereum = process.env.GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM;

const GUARDIAN_REG_DEPOSIT = web3.utils.toWei('1', 'ether');

module.exports = async function(done) {
  try {

    if (!guardiansContractAddress) {
      throw("missing env variable GUARDIANS_CONTRACT_ADDRESS");
    }

    if (!guardianAccountIndexesOnEthereum) {
      throw("missing env variable GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM");
    }

    const guardiansInstance = await artifacts.require('IOrbsGuardians').at(guardiansContractAddress);

    let accounts = await web3.eth.getAccounts();
    let guardianIndexes = JSON.parse(guardianAccountIndexesOnEthereum);
    let guardians = guardianIndexes.map(elem => accounts[elem]);

    let i = 0;
    let txs = guardians.map(address => {
      i++;
      return guardiansInstance.register(`guardianName${i}`, `https://www.guardian${i}.com`, {from: address, value: GUARDIAN_REG_DEPOSIT}).on("transactionHash", hash => {
        console.error("TxHash: " + hash);
      });
    });

    await Promise.all(txs);

    let indexToAddressMap = guardianIndexes.map(i => {return {Index: i, Address: accounts[i]};});
    console.log(JSON.stringify(indexToAddressMap, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

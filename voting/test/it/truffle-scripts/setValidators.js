const validatorsContractAddress = process.env.VALIDATORS_CONTRACT_ADDRESS;
const validatorAccountOnEthereumIndexes = process.env.VALIDATOR_ACCOUNT_INDEXES_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!validatorsContractAddress) {
      throw("missing env variable VALIDATORS_CONTRACT_ADDRESS");
    }

    if (!validatorAccountOnEthereumIndexes) {
      throw("missing env variable VALIDATOR_ACCOUNT_INDEXES_ON_ETHEREUM");
    }

    const validatorsInstance = await artifacts.require('IOrbsValidators').at(validatorsContractAddress);

    let accounts = await web3.eth.getAccounts();
    let validatorIndexes = JSON.parse(validatorAccountOnEthereumIndexes);
    let validators = validatorIndexes.map(elem => accounts[elem]);

    let txs = validators.map(address => {
      return validatorsInstance.addValidator(address).on("transactionHash", hash => {
        console.error("TxHash: " + hash);
      });
    });

    await Promise.all(txs);

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

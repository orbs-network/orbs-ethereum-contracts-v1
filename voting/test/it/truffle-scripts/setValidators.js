const validatorsContractAddress = process.env.VALIDATORS_CONTRACT_ADDRESS;
const validatorsRegistryContractAddress = process.env.VALIDATORS_REGISTRY_CONTRACT_ADDRESS;
const validatorAccountOnEthereumIndexes = process.env.VALIDATOR_ACCOUNT_INDEXES_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!validatorsContractAddress) {
      throw("missing env variable VALIDATORS_CONTRACT_ADDRESS");
    }

    if (!validatorsRegistryContractAddress) {
      throw("missing env variable VALIDATORS_REGISTRY_CONTRACT_ADDRESS");
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

    const validatorsRegInstance = await artifacts.require('IOrbsValidatorsRegistry').at(validatorsRegistryContractAddress);

    let indexToAddressMap = [];
    txs = validatorIndexes.map(i => {
      let address = accounts[i];
      let orbsAddress = accounts[i]; // TODO v1 fix me
      indexToAddressMap.push({Index: i, Address: address, OrbsAddress: orbsAddress});
      return validatorsRegInstance.register(`name${i}`, `0x${(i + "00000000").slice(0, 8)}`, `https://www.validator${i}.com`, address,  {from: address})
          .on("transactionHash", hash => {console.error("TxHash: " + hash);});
    });

    await Promise.all(txs);

    console.log(JSON.stringify(indexToAddressMap, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

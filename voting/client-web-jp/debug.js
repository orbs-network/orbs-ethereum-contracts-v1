const Web3 = require('web3');
const contractsInfo = require('./src/contracts-info');
const EthereumGuardiansContractJSON = require('./src/contracts/OrbsGuardians.json');
const EthereumValidatorsContractJSON = require('./src/contracts/OrbsValidators.json');
const EthereumValidatorsRegistryContractJSON = require('./src/contracts/OrbsValidatorsRegistry.json');

(async () => {
  const web3 = new Web3('http://localhost:7545');
  const from = '0x9D4dB91AaA3573A67Ff7604EAcfC73d03e2C9c7A';

  const guardiansContract = new web3.eth.Contract(
    EthereumGuardiansContractJSON.abi,
    contractsInfo.EthereumGuardiansContract.address
  );

  const validatorsContract = new web3.eth.Contract(
    EthereumValidatorsContractJSON.abi,
    contractsInfo.EthereumValidatorsContract.address
  );

  const validatorsRegistryContract = new web3.eth.Contract(
    EthereumValidatorsRegistryContractJSON.abi,
    contractsInfo.EthereumValidatorsRegistryContract.address
  );

  const guardians = await guardiansContract
    .methods
    .getGuardians(0, 100)
    .call({ from });
  const validators = await validatorsContract.methods.getValidators().call({ from });

  console.log('Guardians:\n', guardians);
  console.log('Validators:\n', validators);

  process.exit();
})();
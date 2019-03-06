const Web3 = require('web3');
const OrbsContractsInfo = require('./src/contracts-info');
const OrbsGuardiansContractJSON = require('./src/contracts/OrbsGuardians.json');
const OrbsValidatorsContractJSON = require('./src/contracts/OrbsValidators.json');
const OrbsValidatorsRegistryContractJSON = require('./src/contracts/OrbsValidatorsRegistry.json');

(async () => {
  const web3 = new Web3('http://localhost:7545');
  const from = '0x0eF55A56D268bB7A01e9D0eA0e9dd56b6DF05F1d';

  const guardiansContract = new web3.eth.Contract(
    OrbsGuardiansContractJSON.abi,
    OrbsContractsInfo.OrbsGuardians.address
  );

  const validatorsContract = new web3.eth.Contract(
    OrbsValidatorsContractJSON.abi,
    OrbsContractsInfo.OrbsValidators.address
  );

  const validatorsRegistryContract = new web3.eth.Contract(
    OrbsValidatorsRegistryContractJSON.abi,
    OrbsContractsInfo.OrbsValidators.address
  );

  const guardians = await guardiansContract
    .methods
    .getGuardians(0, 100)
    .call({ from });
  const validators = await validatorsContract.methods.getValidators().call({ from });
  const data = await validatorsRegistryContract.methods.getValidatorData("0x98117ebd3d4ba9e3f9d5d2201f3f0954e3d4281c").call();

  console.log('Guardians:\n', guardians);
  console.log('Validators:\n', validators);
  console.log('Data:\n', data);

  process.exit();
})();
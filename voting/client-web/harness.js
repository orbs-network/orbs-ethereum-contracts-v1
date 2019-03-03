const Web3 = require('web3');
const OrbsContractsInfo = require('./src/contracts-info');
const OrbsGuardiansContractJSON = require('./src/contracts/OrbsGaurdians.json');
const OrbsValidatorsContractJSON = require('./src/contracts/OrbsValidators.json');

(async () => {
  const web3 = new Web3('http://localhost:7545');
  const from = '0x0eF55A56D268bB7A01e9D0eA0e9dd56b6DF05F1d';
  const accounts = await web3.eth.getAccounts();
  
  const guardians = accounts.slice(0, 5);
  const validators = accounts.slice(6);
  
  const guardiansContract = new web3.eth.Contract(
    OrbsGuardiansContractJSON.abi,
    OrbsContractsInfo.OrbsGaurdians.address
  );

  const validatorsContract = new web3.eth.Contract(
    OrbsValidatorsContractJSON.abi,
    OrbsContractsInfo.OrbsValidators.address
  );

  await Promise.all(guardians.map(address => guardiansContract
    .methods
    .addGuardian(address)
    .send({ from })))

  await Promise.all(validators.map(address => validatorsContract
    .methods
    .addValidator(address)
    .send({ from })))

  process.exit();
})();
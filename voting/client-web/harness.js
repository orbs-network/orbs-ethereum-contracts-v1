const Web3 = require('web3');
const Chance = require('chance');
const OrbsContractsInfo = require('./src/contracts-info');
const OrbsGuardiansContractJSON = require('./src/contracts/OrbsGaurdians.json');
const OrbsValidatorsContractJSON = require('./src/contracts/OrbsValidators.json');

const from = '0x0eF55A56D268bB7A01e9D0eA0e9dd56b6DF05F1d';
const web3 = new Web3('http://localhost:7545');
const chance = new Chance();

const addGuardians = async (guardians, contract) => {
  await Promise.all(guardians.map(address => contract
    .methods
    .addGuardian(address)
    .send({ from })))

  await Promise.all(guardians.map((address) => contract
    .methods
    .setGuardianData(chance.name(), chance.url())
    .send({ from: address })
  ))
};

const addValidators = async (validators, contract) => {
  await Promise.all(validators.map(address => contract
    .methods
    .addValidator(address)
    .send({ from })))

  await Promise.all(validators.map((address, idx) => contract
    .methods
    .setValidatorData(
      chance.name(),
      ("0x" + idx + "00000000").slice(0, 10),
      chance.url(),
      address
    )
    .send({ from: address, gas: 6721975 })))
};

(async () => {
  const accounts = await web3.eth.getAccounts();

  const guardians = accounts.slice(0, 5);
  const validators = accounts.slice(5);

  const guardiansContract = new web3.eth.Contract(
    OrbsGuardiansContractJSON.abi,
    OrbsContractsInfo.OrbsGaurdians.address, { gas: 6721975 }
  );

  const validatorsContract = new web3.eth.Contract(
    OrbsValidatorsContractJSON.abi,
    OrbsContractsInfo.OrbsValidators.address, { gas: 6721975 }
  );

  await addGuardians(guardians, guardiansContract);
  await addValidators(validators, validatorsContract);

  process.exit();
})();
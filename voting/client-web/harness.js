const Web3 = require('web3');
const Chance = require('chance');
const OrbsContractsInfo = require('./src/contracts-info');
const OrbsGuardiansContractJSON = require('./src/contracts/OrbsGuardians.json');
const OrbsValidatorsContractJSON = require('./src/contracts/OrbsValidators.json');
const OrbsValidatorsRegistryContractJSON = require('./src/contracts/OrbsValidatorsRegistry.json');

const from = '0x9D4dB91AaA3573A67Ff7604EAcfC73d03e2C9c7A';
const web3 = new Web3('http://localhost:7545');
const chance = new Chance();

const addGuardians = async (guardians, contract) => {
  await Promise.all(guardians.map(address => contract
    .methods
    .register(chance.name(), chance.url())
    .send({ from: address, gas: 6721975 })));
};

const addValidators = async (validators, contract, registryContract) => {
  await Promise.all(validators.map(address => contract
    .methods
    .addValidator(address)
    .send({ from })))

  await Promise.all(validators.map((address, idx) => registryContract
    .methods
    .register(
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
    OrbsContractsInfo.OrbsGuardians.address, { gas: 6721975 }
  );

  const validatorsContract = new web3.eth.Contract(
    OrbsValidatorsContractJSON.abi,
    OrbsContractsInfo.OrbsValidators.address, { gas: 6721975 }
  );

  const validatorsRegistryContract = new web3.eth.Contract(
    OrbsValidatorsRegistryContractJSON.abi,
    OrbsContractsInfo.OrbsValidatorsRegistry.address, { gas: 6721975 }
  );

  await addGuardians(guardians, guardiansContract);
  await addValidators(validators, validatorsContract, validatorsRegistryContract);

  process.exit();
})();
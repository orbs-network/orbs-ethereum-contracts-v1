const express = require('express');
const contractsInfo = require('../contracts-info');
const validatorsContractJSON = require('../contracts/OrbsValidators.json');
const validatorsRegistryContractJSON = require('../contracts/OrbsValidatorsRegistry.json');

const validatorsApiFactory = web3 => {
  const router = express.Router();

  const validatorsContract = new web3.eth.Contract(
    validatorsContractJSON.abi,
    contractsInfo.EthereumValidatorsContract.address
  );

  const validatorsRegistryContract = new web3.eth.Contract(
    validatorsRegistryContractJSON.abi,
    contractsInfo.EthereumValidatorsRegistryContract.address
  );

  router.get('/validators', async (req, res) => {
    const validators = await validatorsContract.methods.getValidators().call();
    res.json(validators);
  });

  router.get('/validators/:address', async (req, res) => {
    try {
      const data = await validatorsRegistryContract.methods
        .getValidatorData(req.params['address'])
        .call();
      res.json(data);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = validatorsApiFactory;

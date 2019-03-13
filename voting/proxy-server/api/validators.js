const express = require('express');
const OrbsContractsInfo = require('../contracts-info');
const OrbsValidatorsContractJSON = require('../contracts/OrbsValidators.json');
const OrbsValidatorsRegistryContractJSON = require('../contracts/OrbsValidatorsRegistry.json');

const validatorsApiFactory = web3 => {
  const router = express.Router();

  const validatorsContract = new web3.eth.Contract(
    OrbsValidatorsContractJSON.abi,
    OrbsContractsInfo.OrbsValidators.address
  );

  const validatorsRegistryContract = new web3.eth.Contract(
    OrbsValidatorsRegistryContractJSON.abi,
    OrbsContractsInfo.OrbsValidatorsRegistry.address
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

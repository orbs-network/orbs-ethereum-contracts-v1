const express = require('express');
const OrbsContractsInfo = require('../contracts-info');
const OrbsGuardiansContractJSON = require('../contracts/OrbsGuardians.json');

const guardiansApiFactory = web3 => {
  const router = express.Router();

  const guardiansContract = new web3.eth.Contract(
    OrbsGuardiansContractJSON.abi,
    OrbsContractsInfo.OrbsGuardians.address
  );

  router.get('/guardians', async (req, res) => {
    try {
      const guardians = await guardiansContract.methods
        .getGuardians(0, 100)
        .call();
      res.json(guardians);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  router.get('/guardians/:address', async (req, res) => {
    try {
      const data = await guardiansContract.methods
        .getGuardianData(req.params['address'])
        .call();
      res.json(data);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = guardiansApiFactory;

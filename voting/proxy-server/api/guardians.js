const express = require('express');
const Orbs = require('orbs-client-sdk');
const OrbsContractsInfo = require('../contracts-info');
const OrbsGuardiansContractJSON = require('../contracts/OrbsGuardians.json');

const guardiansApiFactory = (web3, orbsAccount, orbsClient) => {
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
      const address = req.params['address'];
      const data = await guardiansContract.methods
        .getGuardianData(address)
        .call();

      const query = orbsClient.createQuery(
        orbsAccount.publicKey,
        'BenchmarkToken',
        'getBalance',
        [Orbs.argAddress(address.toLowerCase())]
      );

      const {outputArguments} = await orbsClient.sendQuery(query);

      data['balance'] = outputArguments[0].value.toString();

      res.json(data);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = guardiansApiFactory;

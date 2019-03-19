const express = require('express');
const Orbs = require('orbs-client-sdk');
const contractsInfo = require('../contracts-info');
const guardiansContractJSON = require('../contracts/OrbsGuardians.json');

const guardiansApiFactory = (web3, orbsClientService) => {
  const router = express.Router();

  const guardiansContract = new web3.eth.Contract(
    guardiansContractJSON.abi,
    contractsInfo.EthereumGuardiansContract.address
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

      const [votingWeightResults, totalStakeResults] = await Promise.all([
        orbsClientService.getGuardianVoteWeight(address),
        orbsClientService.getTotalStake()
      ]);

      data['stake'] = (votingWeightResults / totalStakeResults).toString();

      res.json(data);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = guardiansApiFactory;

const express = require('express');

const guardiansApiFactory = (ethereumClient, orbsClientService) => {
  const router = express.Router();

  router.get('/guardians', async (req, res) => {
    try {
      const { offset, limit } = req.query;
      const guardians = await ethereumClient.getGuardians(offset, limit);
      res.json(guardians);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  router.get('/guardians/:address', async (req, res) => {
    try {
      const address = req.params['address'];
      const data = await ethereumClient.getGuardianData(address);

      const [votingWeightResults, totalStakeResults] = await Promise.all([
        orbsClientService.getGuardianVoteWeight(address),
        orbsClientService.getTotalStake()
      ]);

      data['stake'] = (
        (100n * votingWeightResults) /
        totalStakeResults
      ).toString();

      res.json(data);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = guardiansApiFactory;

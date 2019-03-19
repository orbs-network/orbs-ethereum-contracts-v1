const express = require('express');

const stakeApiFactory = orbsClientService => {
  const router = express.Router();

  router.get('/stake/total', async (req, res) => {
    try {
      const totalStake = await orbsClientService.getTotalStake();
      res.send(totalStake.toString());
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  router.get('/stake/validator/:address', async (req, res) => {});

  return router;
};

module.exports = stakeApiFactory;

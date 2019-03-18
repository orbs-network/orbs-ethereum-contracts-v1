const express = require('express');

const rewardsApiFactory = () => {
  const router = express.Router();

  router.get('/rewards/:address', async (req, res) => {
    res.json({
      delegatorReward: 10000,
      guardianReward: 20000,
      validatorReward: 30000,
      totalReward: 60000
    });
  });

  return router;
};

module.exports = rewardsApiFactory;

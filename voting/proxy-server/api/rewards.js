const express = require('express');

const rewardsApiFactory = orbsClient => {
  const router = express.Router();

  router.get('/rewards/:address', async (req, res) => {
    const address = req.params['address'];
    const [
      delegatorReward,
      guardianReward,
      validatorReward
    ] = await Promise.all([
      orbsClient.getParticipationReward(address),
      orbsClient.getGuardianReward(address),
      orbsClient.getValidatorReward(address)
    ]);

    res.json({
      delegatorReward: delegatorReward.toString(),
      guardianReward: guardianReward.toString(),
      validatorReward: validatorReward.toString(),
      totalReward: (
        delegatorReward +
        guardianReward +
        validatorReward
      ).toString()
    });
  });

  return router;
};

module.exports = rewardsApiFactory;

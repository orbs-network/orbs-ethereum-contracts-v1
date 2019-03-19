const express = require('express');

const validatorsApiFactory = (ethereumClient, orbsClientService) => {
  const router = express.Router();

  router.get('/validators', async (req, res) => {
    const validators = await ethereumClient.getValidators();
    res.json(validators);
  });

  router.get('/validators/:address', async (req, res) => {
    try {
      const address = req.params['address'];
      const data = await ethereumClient.getValidatorData(address);

      const [validatorVotesResults, totalStakeResults] = await Promise.all([
        orbsClientService.getValidatorVotes(address),
        orbsClientService.getTotalStake()
      ]);

      data['votesAgainst'] = (
        (100n * validatorVotesResults) /
        totalStakeResults
      ).toString();

      res.json(data);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = validatorsApiFactory;

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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

      if (totalStakeResults === 0n) {
        data['votesAgainst'] = '0';
      } else {
        data['votesAgainst'] = (
          (100n * validatorVotesResults) /
          totalStakeResults
        ).toString();
      }

      res.json(data);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = validatorsApiFactory;

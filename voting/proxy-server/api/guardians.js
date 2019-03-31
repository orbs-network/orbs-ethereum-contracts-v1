/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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

      if (totalStakeResults === 0n) {
        data['stake'] = '0';
      } else {
        data['stake'] = (
          (100n * votingWeightResults) /
          totalStakeResults
        ).toString();
      }

      res.json(data);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = guardiansApiFactory;

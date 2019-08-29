/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

const electionsRouter = electionsApi => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /elections/upcoming:
   *  get:
   *    description: Returns Ethereum block number of the upcoming elections
   *    tags:
   *      - Elections
   *    responses:
   *      '200':
   *        description: Ethereum block number of the upcoming elections
   */
  router.get('/elections/upcoming', async (_, res) => {
    try {
      const upcomingElections = await electionsApi.getUpcomingElectionBlockNumber();
      res.send(upcomingElections.toString());
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  /**
   * @swagger
   *
   * /elections/effective:
   *  get:
   *    description: Returns Ethereum block number of the effective elections
   *    tags:
   *      - Elections
   *    responses:
   *      '200':
   *        description: Ethereum block number of effective elections
   */
  router.get('/elections/effective', async (_, res) => {
    try {
      const blockNumber = await electionsApi.getEffectiveElectionBlockNumber();
      res.send(blockNumber.toString());
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = electionsRouter;

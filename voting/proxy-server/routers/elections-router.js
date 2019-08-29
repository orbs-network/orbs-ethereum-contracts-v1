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
   * /elections/next:
   *  get:
   *    description: Returns Ethereum block number of next elections
   *    tags:
   *      - Elections
   *    responses:
   *      '200':
   *        description: Ethereum block number of next elections
   */
  router.get('/elections/next', async (_, res) => {
    try {
      const nextElections = await electionsApi.getNextElectionsBlockNumber();
      res.send(nextElections.toString());
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  /**
   * @swagger
   *
   * /elections/past:
   *  get:
   *    description: Returns Ethereum block number of past elections
   *    tags:
   *      - Elections
   *    responses:
   *      '200':
   *        description: Ethereum block number of past elections
   */
  router.get('/elections/past', async (_, res) => {
    try {
      const blockNumber = await electionsApi.getPastElectionBlockNumber();
      res.send(blockNumber.toString());
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = electionsRouter;

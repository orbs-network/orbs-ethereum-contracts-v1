/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

const stakeRouter = apiService => {
  const router = express.Router();
  const numberFormatter = new Intl.NumberFormat('en');

  /**
   * @swagger
   *
   * /total-participating-tokens:
   *  get:
   *    description: Returns total participating stake
   *    responses:
   *      '200':
   *        description: Formatted string of total stake
   */
  router.get('/total-participating-tokens', async (req, res) => {
    try {
      const totalParticipatingTokens = await apiService.getTotalParticipatingTokens();
      res.send(numberFormatter.format(totalParticipatingTokens.toString()));
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  router.get('/stake/validator/:address', async (req, res) => {});

  return router;
};

module.exports = stakeRouter;

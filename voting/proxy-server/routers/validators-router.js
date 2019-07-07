/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

const validatorsRouter = apiService => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /validators:
   *  get:
   *    description: Returns the list of validators
   *    tags:
   *      - Validators
   *    responses:
   *      '200':
   *        description: The list of validators
   */
  router.get('/validators', async (req, res) => {
    try {
      const validators = await apiService.getValidators();
      res.json(validators);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  /**
   * @swagger
   *
   * /validators/{address}:
   *  get:
   *    description: Returns the information about particular validator
   *    tags:
   *      - Validators
   *    parameters:
   *      - name: address
   *        in: path
   *        description: Validator ethereum address
   *        required: true
   *    responses:
   *      '200':
   *        description: The detailed information about the validator with given address
   */
  router.get('/validators/:address', async (req, res) => {
    try {
      const address = req.params['address'];
      const data = await apiService.getValidatorInfo(address);
      res.json(data);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = validatorsRouter;

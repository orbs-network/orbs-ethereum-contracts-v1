/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

const electedValidatorsRouter = (electedValidatorsApi) => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /validators/elected:
   *  get:
   *    description: Returns the list of elected validators
   *    tags:
   *      - Validators
   *    responses:
   *      '200':
   *        description: The list of elected validators
   */
  router.get('/validators/elected', async (req, res) => {
    const data = await electedValidatorsApi.getElectedValidators();
    res.json(data);
  });

  /**
   * @swagger
   *
   * /validators/elected/{address}:
   *  get:
   *    description: Returns the information about particular elected validator
   *    tags:
   *      - Validators
   *    parameters:
   *      - name: address
   *        in: path
   *        description: Validator ethereum address
   *        required: true
   *    responses:
   *      '200':
   *        description: The detailed information about the elected validator with given address
   */
  router.get('/validators/elected/:address', async (req, res) => {
    try {
      const address = req.params['address'];
      const result = await electedValidatorsApi.getElectedValidatorInfo(address);
      res.json(result);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = electedValidatorsRouter;

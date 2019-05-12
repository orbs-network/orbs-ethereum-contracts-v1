/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

const ADDRESS_LENGTH = 20;

const electedValidatorsApiFactory = (ethereumClient, orbsClientService) => {
  const router = express.Router();

  const getElectedValidators = async () => {
    const data = await orbsClientService.getElectedValidators();
    const addresses = [];
    for (let i = 0; i < data.length; i += ADDRESS_LENGTH) {
      addresses.push(`0x${data.slice(i, i + ADDRESS_LENGTH).toString('hex')}`);
    }
    return addresses;
  };

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
    const data = await getElectedValidators();
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
      const validatorData = await ethereumClient.getValidatorData(address);
      const stake = await orbsClientService.getValidatorStake(address);

      const result = Object.assign({}, validatorData, {
        stake: stake.toString()
      });
      res.json(result);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = electedValidatorsApiFactory;

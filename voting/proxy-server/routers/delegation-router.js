/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

const delegationRouter = delegationApi => {
  const router = express.Router();

  /**
   * @swagger
   *
   * /delegation/status:
   *  get:
   *    description: Returns the address of current delegate
   *    tags:
   *      - Delegation
   *    parameters:
   *      - name: address
   *        in: query
   *        required: true
   *        description: The address for whom the delegation status should be checked
   *    responses:
   *      '200':
   *        description: Delegate address
   */
  router.get('/delegation/status', async (req, res) => {
    try {
      const address = req.query['address'];
      const result = await delegationApi.getDelegatee(address);
      res.send(result);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  /**
   * @swagger
   *
   * /delegation:
   *  get:
   *    description: Returns the information about the delegation
   *    tags:
   *      - Delegation
   *    parameters:
   *      - name: address
   *        in: query
   *        required: true
   *        description: The address for whom the delegation status should be checked
   *    responses:
   *      '200':
   *        description: Delegation information
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                delegatedTo:
   *                  type: string
   *                  description: The address of a delegate
   *                delegatorBalance:
   *                  type: string
   *                  description: The amount of ORBS tokens that delegator posses
   *                delegationType:
   *                  type: string
   *                  enum: [Delegate, Transfer]
   *                  description: The method of delegation
   *                delegationBlockNumber:
   *                  type: string
   *                  description: The block height when delegation has occurred
   *                delegationTimestamp:
   *                  type: string
   *                  description: Time and date of delegation
   */
  router.get('/delegation', async (req, res) => {
    try {
      const address = req.query['address'];
      const info = await delegationApi.getDelegationInfo(address);
      res.send(info);
    } catch (err) {
      res.status(500).send(err.toString());
    }
  });

  return router;
};

module.exports = delegationRouter;

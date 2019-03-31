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

  router.get('/validators/elected', async (req, res) => {
    const data = await getElectedValidators();
    res.json(data);
  });

  router.get('/validators/elected/:address', async (req, res) => {
    try {
      const address = req.params['address'];
      const validatorData = await ethereumClient.getValidatorData(address);
      const stake = await orbsClientService.getValidatorStake(address);
      const [
        delegatorReward,
        guardianReward,
        validatorReward
      ] = await Promise.all([
        orbsClientService.getParticipationReward(address),
        orbsClientService.getGuardianReward(address),
        orbsClientService.getValidatorReward(address)
      ]);
      const result = Object.assign({}, validatorData, {
        stake: stake.toString(),
        participationReward: delegatorReward.toString(),
        totalReward: (
          delegatorReward +
          guardianReward +
          validatorReward
        ).toString()
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

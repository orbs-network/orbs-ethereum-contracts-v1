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
        delegatorRewardResponse,
        guardianRewardResponse,
        validatorRewardResponse
      ] = await Promise.all([
        orbsClientService.getParticipationReward(address),
        orbsClientService.getGuardianReward(address),
        orbsClientService.getValidatorReward(address)
      ]);

      const delegatorReward =
        delegatorRewardResponse > 0n
          ? (delegatorRewardResponse * 236223785n) / 1000000000n
          : 0n;
      const guardianReward =
        guardianRewardResponse > 0n
          ? (guardianRewardResponse * 442919598n) / 1000000000n
          : 0n;
      const validatorReward =
        validatorRewardResponse > 0n
          ? ((validatorRewardResponse - 8423n) * 8422121n) / 1000000000n + 8423n
          : 0n;

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

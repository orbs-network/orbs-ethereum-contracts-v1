/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');

const rewardsApiFactory = orbsClient => {
  const router = express.Router();

  router.get('/rewards/:address', async (req, res) => {
    const address = req.params['address'];
    const [
      delegatorRewardResponse,
      guardianRewardResponse,
      validatorRewardResponse
    ] = await Promise.all([
      orbsClient.getParticipationReward(address),
      orbsClient.getGuardianReward(address),
      orbsClient.getValidatorReward(address)
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

    res.json({
      delegatorReward: delegatorReward.toString(),
      guardianReward: guardianReward.toString(),
      validatorReward: validatorReward.toString(),
      totalReward: (
        delegatorReward +
        guardianReward +
        validatorReward
      ).toString()
    });
  });

  return router;
};

module.exports = rewardsApiFactory;

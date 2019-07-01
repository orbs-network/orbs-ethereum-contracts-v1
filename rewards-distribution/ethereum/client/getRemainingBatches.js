/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');

module.exports = async function(done) {
  try {

    console.log("usage: truffle exec client/executeBatches.js [rewards contract address] [distribution event name]");
    const rewardsAddress = process.argv[4];
    const distributionEvent = process.argv[5];

    console.log("OrbsRewardsDistribution address:", rewardsAddress);
    console.log("distributionEvent:", distributionEvent);

    const rewards = await OrbsRewardsDistribution.at(rewardsAddress);

    console.log("remaining batches:", await rewards.getPendingBatches(distributionEvent));

    done()
  } catch (e) {
    console.log(e);
    done(e);
  }
};

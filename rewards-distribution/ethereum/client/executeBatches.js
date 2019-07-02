/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const {RewardsClient} = require('./RewardsClient');
const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');

module.exports = async function(done) {
  try {

    console.log("usage: truffle exec client/executeBatches.js [rewards contract address] [rewards csv file] [batchSize] [distribution event name]");
    const rewardsAddress = process.argv[4];
    const filename = process.argv[5];
    const batchSize = parseInt(process.argv[6]);
    const distributionEvent = process.argv[7];

    console.log("OrbsRewardsDistribution address:", rewardsAddress);
    console.log("filename:", filename);
    console.log("batch size:", batchSize);
    console.log("distributionEvent:", distributionEvent);

    const rewards = await OrbsRewardsDistribution.at(rewardsAddress);
    const rewardsClient = new RewardsClient(rewards);

    const {batches} = await rewardsClient.parseBatches(filename, batchSize);

    const accounts = await web3.eth.getAccounts();
    const result = await rewardsClient.executeBatches(distributionEvent, batches, {from: accounts[0]});

    console.log("executionResult", JSON.stringify(result, null, 2));
   // TODO print results in a nice way...

    done()
  } catch (e) {
    console.log(e);
    done(e);
  }
};

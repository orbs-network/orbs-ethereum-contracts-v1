/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const {RewardsClient} = require('./RewardsClient');

module.exports = async function() {
  try {

    console.log("usage: truffle exec client/getBatchHashes.js [rewards csv file] [batchSize]");
    const filename = process.argv[4];
    const batchSize = parseInt(process.argv[5]);

    console.log(`parsing file ${filename} into batches of up to ${batchSize} payments each`);
    const {totalAmount, rewardsSuperset, batches, hashes} = await (new RewardsClient(null)).parseBatches(filename, batchSize);

    console.log("total rewards amount:", totalAmount.toString());
    console.log("# rewards:", rewardsSuperset.length);
    console.log("# batches:", batches.length);
    console.log("---------------------------");
    console.log("batch hashes:\n", JSON.stringify(hashes));
    console.log("---------------------------");

    console.log();
    console.log("samples - last payment in each batch:");
    console.log("---------------------------");
    for (let i = 0, supersetOffset = 2; i < batches.length; supersetOffset += batches[i].length, i++) {
      const idx = batches[i].length - 1;
      console.log("row:", supersetOffset + idx, "batchIdx:", i, "idx in batch:", idx, "amount:", batches[i][idx].amount.toString(), "recipient", batches[i][idx].address);
    }

  } catch (e) {
    console.log(e);
    done(e);
  }
};

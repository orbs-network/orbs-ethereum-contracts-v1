/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

module.exports = async function(done) {
  try {

    let block = await web3.eth.getBlock("latest")

    console.log(JSON.stringify({
      CurrentBlock: block.number
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

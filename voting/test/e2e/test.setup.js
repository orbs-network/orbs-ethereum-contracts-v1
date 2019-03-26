/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const util = require('util');
const ganache = require('./src/ganache');
const { exec } = require('child_process');

module.exports = async () => {
  await util.promisify(exec)('./scripts/build-client.sh');
  // await util.promisify(exec)('./scripts/build-metamask.sh');
  global.ganacheContainerId = await ganache.start();
};
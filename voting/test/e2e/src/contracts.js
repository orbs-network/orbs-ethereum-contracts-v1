/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const { exec } = require('child_process');
const util = require('util');

const deploy = async () => {
  const { err, stdout } = await util.promisify(exec)(
    './scripts/deploy-contracts.sh'
  );
  if (err) {
    throw new Error(err);
  }
  const truffleReport = stdout.substring(stdout.indexOf('Starting migrations'));
  const chunks = truffleReport.split('Replacing');
  const contracts = {};
  for (let i = 1; i < chunks.length; i++) {
    const lines = chunks[i].split('\n');
    const contractName = lines[0].trim().replace(/['\']+/g, '');
    const addressLine = lines.find(line => line.includes('contract address'));
    const address = addressLine.substring(addressLine.indexOf(':') + 1).trim();
    contracts[contractName] = { address };
  }
  return contracts;
};

module.exports = { deploy };

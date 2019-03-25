/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const { seed } = require('./metamask-extension');
const { Docker, Options } = require('docker-cli-js');

const GANACHE_PORT = '8545';
const NETWORK_ID = '5777';

const docker = new Docker(new Options());

const start = async () => {
  return docker
    .command(
      `run -p "${GANACHE_PORT}:${GANACHE_PORT}" -d trufflesuite/ganache-cli -m '${seed}' -i ${NETWORK_ID} -p ${GANACHE_PORT}`
    )
    .then(data => data.containerId);
};

const stop = async containerId => {
  return docker.command(`stop ${containerId}`);
};

module.exports = { start, stop, GANACHE_PORT };

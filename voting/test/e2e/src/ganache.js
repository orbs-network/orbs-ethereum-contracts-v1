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

module.exports = { start, stop };

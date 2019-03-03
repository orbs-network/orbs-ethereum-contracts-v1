const util = require('util');
const ganache = require('./src/ganache');
const { exec } = require('child_process');

module.exports = async () => {
  await util.promisify(exec)('./scripts/build-client.sh');
  // await util.promisify(exec)('./scripts/build-metamask.sh');
  global.ganacheContainerId = await ganache.start();
};
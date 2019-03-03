const ganache = require('./src/ganache');

module.exports = async () => {
  await ganache.stop(global.ganacheContainerId);
};
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

import chai from 'chai';

const { expect } = chai;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const Federation = artifacts.require('./Federation.sol');
const AutonomousSwapProofVerifierWrapper = artifacts.require('./AutonomousSwapProofVerifierWrapper.sol');

async function gammaCli(args) {
  console.log(`*** Running: gamma-cli ${args}`);
  const { stdout } = await exec(`gamma-cli ${args}`);
  console.log(stdout);
  return stdout;
}

function extractTxId(output) {
  const re = /"TxId": "(\w+)"/;
  return re.exec(output)[1];
}

function extractPackedProof(output) {
  const re = /"PackedProof": "(\w+)"/;
  return re.exec(output)[1];
}

contract('AutonomousSwapProofVerifier', (accounts) => {
  const owner = accounts[0];

  describe('e2e test - with gamma', async () => {
    let verifier;

    beforeEach(async () => {
      const federation = await Federation.new(accounts.slice(0, 2), { from: owner });
      verifier = await AutonomousSwapProofVerifierWrapper.new(federation.address, { from: owner });
    });

    beforeEach(async () => {
      await gammaCli('start-local -wait');
      await gammaCli('deploy -name MyContract -code ./test/contract-test/contract.go');
    });

    afterEach(async () => {
      await gammaCli('stop-local');
    });

    it('E2E test', async () => {
      const txId = extractTxId(await gammaCli('send-tx -i ./test/contract-test/test-event.json'));
      const packedProofHex = extractPackedProof(await gammaCli(`tx-proof -txid ${txId}`));

      console.log('\n+++++++++++++++++++++++++++++++++++++++++++++++++++++');
      console.log(`TODO: We should parse PackedProof: ${packedProofHex}`);
      console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++\n');

      // continue test here
    });
  });
});

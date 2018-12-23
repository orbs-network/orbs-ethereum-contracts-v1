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

function extractPackedReceipt(output) {
  const re = /"PackedReceipt": "(\w+)"/;
  return re.exec(output)[1];
}

contract('AutonomousSwapProofVerifier', (accounts) => {
  const owner = accounts[0];

  describe('e2e test - with gamma', async () => {
    const fs = require('fs');
    let receipt_proof_data;

    fs.readFile('./test/contract-test/VerifierEndToEndData.json', 'utf8', (err, fileContents) => {
      if (err) {
        console.error(err)
        return;
      }
      try {
        receipt_proof_data = JSON.parse(fileContents)
      } catch(err) {
        console.error(err);
      }
    })

    let federationMemberAccounts;
    let federationMembersAddresses;
    let federation;
    let verifier;

    beforeEach(async () => {
      federationMemberAccounts = receipt_proof_data.ResultsBlockProof.Signatures;
      federationMembersAddresses = federationMemberAccounts.map(account => `0x` + account.MemberId);
      federation = await Federation.new(federationMembersAddresses, { from: owner });
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
      const sendTxOutput = await gammaCli('send-tx -i ./test/contract-test/test-event.json');
      const txId = extractTxId(sendTxOutput);
      const txProofOutput = await gammaCli(`tx-proof -txid ${txId}`);
      const packedProofHex = extractPackedProof(txProofOutput);
      const packedReceiptHex = extractPackedReceipt(txProofOutput);

      console.log('\n+++++++++++++++++++++++++++++++++++++++++++++++++++++');
      console.log(`TODO: We should parse PackedReceipt: ${packedReceiptHex} and PackedProof: ${packedProofHex}`);
      console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++\n');

      console.log(txProofOutput);

      const output = await verifier.processPackedProofRaw.call('0x' + packedProofHex, '0x' + packedReceiptHex);

      console.log(output);

      expect(output[1]).to.be.bignumber.equal(Number(receipt_proof_data.ResultsBlockHeader.VirtualChainId));
      expect(output[2]).to.eql(receipt_proof_data.Event.ContractName);
      expect(output[3]).to.eql("0x" + receipt_proof_data.Event.OrbsAddress);
      expect(output[4]).to.eql("0x" + receipt_proof_data.Event.EthAddress);
      expect(output[5]).to.be.bignumber.equal(Number(receipt_proof_data.Event.Amount));
      expect(output[6]).to.be.bignumber.equal(Number(receipt_proof_data.Event.Tuid));

    });
  });
});

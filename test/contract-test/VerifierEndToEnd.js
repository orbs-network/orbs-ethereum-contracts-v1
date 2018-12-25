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
      //const packedProofHex = extractPackedProof(txProofOutput);
      //const packedReceiptHex = extractPackedReceipt(txProofOutput);

      const packedProofHex = "d8000000010000002a00000040f0010000000000200000000e6d6122a35c23b057998e5fa96854069f410197e96f7eb96ad658e0c0643d3385c66da30b857315200000005ddb959327e0b3371b9da8bc90aa32803383bb126d3d7f19d93d103cfd9d16fc20000000680da112b8f06f6328b416aaf4a1aabc5513aa76bff2a422aeb854802c25079a200000009d4b2ad9c7845971bd8dd10177ebc8b8371546034048684d0b2e2258ae690f18200000001f4939064138ba44fbbdb2401fda3d23d36711b980b35a74339ae5bc1867c7d6000000000100000002000000d6000000200000009d4b2ad9c7845971bd8dd10177ebc8b8371546034048684d0b2e2258ae690f1800000000aa000000380000000300000040f001000000000001000000000000002000000014faa430d7ba48f6f2834ce3fd981c6747949f0b61dd6285544e6299ded3ff9d610000005d00000014000000fca8200d67df5d0180d47d7fda762f2f174bb7d0410000005a5fe154058020b341ca752a92059a6aed834e5007b3986d98d87cf254936d863020eb58fe177ddf63dac4b92c22c9053b2706453e74af8db52a92e58f01603301000000020000000102000000000000";
      const packedReceiptHex = "200000008423d68d0acc20efdb087abf75d0ab6789745dab840e45794a00134f793e62920100000000000000b0000000ac000000090000006173625f6574686572000000120000004f7262735472616e736665727265644f7574000080000000140000000600000075696e7436340100010000000000000024000000050000006279746573000300140000000ec4325e12ecfa9e2096509ca8399d8b8fb0fab4240000000500000062797465730003001400000003818abd13919d26be670b6523b5f76495f7f48f140000000600000075696e74363401007800000000000000";

      const output = await verifier.processPackedProofRaw.call('0x' + packedProofHex, '0x' + packedReceiptHex);

      console.log(output);
      const contract_name = "asb_ether";
      const eth_address = "0x0102030405060708090a0102030405060708090a";
      const orbs_address = "0x1112131415161718191a1112131415161718191a";
      const tuid = 1;
      const amount = 1001;

      expect(output[2]).to.eql(contract_name);
      expect(output[3]).to.eql(eth_address);
      expect(output[4]).to.eql(orbs_address);
      expect(output[5]).to.be.bignumber.equal(Number(amount));
      expect(output[6]).to.be.bignumber.equal(Number(tuid));

    });
  });
});

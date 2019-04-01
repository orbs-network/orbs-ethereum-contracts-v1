/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const userAccountOnEthereum = process.env.USER_ACCOUNT_ON_ETHEREUM;
const packedOrbsReceiptProof = process.env.PACKED_ORBS_RECEIPT_PROOF;
const packedOrbsReceipt = process.env.PACKED_ORBS_RECEIPT;

module.exports = async function(done) {
  try {

    if (!userAccountOnEthereum) {
      throw("missing env variable USER_ACCOUNT_ON_ETHEREUM");
    }

    if (!packedOrbsReceiptProof) {
      throw("missing env variable PACKED_ORBS_RECEIPT_PROOF");
    }

    if (!packedOrbsReceipt) {
      throw("missing env variable PACKED_ORBS_RECEIPT");
    }

    const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
    let instance = await AutonomousSwapBridge.deployed();

    let response = await instance.transferIn(packedOrbsReceiptProof, packedOrbsReceipt, {from: userAccountOnEthereum});

    console.log(JSON.stringify({
      TxHash: response.tx,
      Logs: response.receipt.logs,
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

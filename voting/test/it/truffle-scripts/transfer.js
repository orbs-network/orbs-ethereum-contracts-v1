/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const userAccountFrom = process.env.FROM_ACCOUNT_INDEX_ON_ETHEREUM;
const userAccountTo = process.env.TO_ACCOUNT_INDEX_ON_ETHEREUM;
const transferAmount = process.env.TRANSFER_AMOUNT;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!userAccountFrom) {
      throw("missing env variable FROM_ACCOUNT_INDEX_ON_ETHEREUM");
    }

    if (!userAccountTo) {
      throw("missing env variable TO_ACCOUNT_INDEX_ON_ETHEREUM");
    }

    if (!transferAmount) {
      throw("missing env variable TRANSFER_AMOUNT");
    }

    const ercToken = artifacts.require('IERC20');
    const instance = await ercToken.at(erc20ContractAddress);


    let accounts = await web3.eth.getAccounts();
    console.log(`from ${accounts[userAccountFrom]}(ind: ${userAccountFrom}) to ${accounts[userAccountTo]}(ind: ${userAccountTo})`);
    await instance.transfer(accounts[userAccountTo], transferAmount, {from: accounts[userAccountFrom]}).on("transactionHash", hash => {
      console.error("TxHash: " + hash);
    });

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

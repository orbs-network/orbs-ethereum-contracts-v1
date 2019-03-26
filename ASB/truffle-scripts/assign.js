/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const userAccountOnEthereum = process.env.USER_ACCOUNT_ON_ETHEREUM;
const userInitialBalanceOnEthereum = process.env.USER_INITIAL_BALANCE_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!userAccountOnEthereum) {
      throw("missing env variable USER_ACCOUNT_ON_ETHEREUM");
    }

    if (!userInitialBalanceOnEthereum) {
      throw("missing env variable USER_INITIAL_BALANCE_ON_ETHEREUM");
    }

    const ercToken = artifacts.require('TestingERC20');
    const instance = await ercToken.at(erc20ContractAddress);

    await instance.assign(userAccountOnEthereum, userInitialBalanceOnEthereum, {from: userAccountOnEthereum}).on("transactionHash", hash => {
      console.error("TxHash: " + hash);
    });

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

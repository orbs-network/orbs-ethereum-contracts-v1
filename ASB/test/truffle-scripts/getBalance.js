/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const userAccountOnEthereum = process.env.USER_ACCOUNT_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!erc20ContractAddress) {
      throw("missing env variable ERC20_CONTRACT_ADDRESS");
    }

    if (!userAccountOnEthereum) {
      throw("missing env variable USER_ACCOUNT_ON_ETHEREUM");
    }

    const ercToken = artifacts.require('TestingERC20');
    const instance = await ercToken.at(erc20ContractAddress);

    let balance = await instance.balanceOf(userAccountOnEthereum, {from: userAccountOnEthereum});

    console.log(JSON.stringify({
      Balance: balance
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
const activistAccount = process.env.ACTIVIST_ACCOUNT_INDEX_ON_ETHEREUM;
const candiatesStr = process.env.CANDIDATE_ACCOUNT_INDEXES_ON_ETHEREUM;

module.exports = async function(done) {
  try {

    if (!votingContractAddress) {
      throw("missing env variable VOTING_CONTRACT_ADDRESS");
    }

    if (!activistAccount) {
      throw("missing env variable ACTIVIST_ACCOUNT_INDEX_ON_ETHEREUM");
    }

    if (!candiatesStr) {
      throw("missing env variable CANDIDATE_ACCOUNT_INDEXES_ON_ETHEREUM");
    }

    const votingInstance = await artifacts.require('IOrbsVoting').at(votingContractAddress);

    let accounts = await web3.eth.getAccounts();
    let candidateIndexes = JSON.parse(candiatesStr);
    let candidates = candidateIndexes.map(elem => accounts[elem]);
    console.log(`from ${accounts[activistAccount]}(ind: ${activistAccount}) to ${candidates}(ind: ${candiatesStr})`);
    await votingInstance.voteOut(candidates, {from: accounts[activistAccount]}).on("transactionHash", hash => {
      console.error("TxHash: " + hash);
    });

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};

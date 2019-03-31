/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

// Special non-standard methods implemented by ganache-cli that aren’t included within the original RPC specification.
// See https://github.com/ethereumjs/testrpc#implemented-methods

const increaseTime = (time) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [time], // Time increase param.
      id: new Date().getTime(),
    }, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
};

const takeSnapshot = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_snapshot',
      params: [],
      id: new Date().getTime(),
    }, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result.result);
    });
  });
};

const revertToSnapshot = (snapShotId) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_revert',
      params: [snapShotId],
      id: new Date().getTime(),
    }, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
};

const mine = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      params: [],
      id: new Date().getTime(),
    }, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
};

module.exports.increaseTime = increaseTime;
module.exports.takeSnapshot = takeSnapshot;
module.exports.revertToSnapshot = revertToSnapshot;
module.exports.mine = mine;

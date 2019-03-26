/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic = process.env.ROPSTEN_SECRET;

module.exports = {
  networks: {
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, process.env.ROPSTEN_INFURA_URL, 0, 10),
      network_id: '3',
    },
    ganache: {
      host: 'ganache',
      port: 7545,
      network_id: '5777',
    },
  },
  compilers: {
    solc: {
      version: '0.4.25',
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
  },
};
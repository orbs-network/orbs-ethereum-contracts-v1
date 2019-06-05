/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const path = require("path");
const HDWalletProvider = require("truffle-hdwallet-provider");
const Resolver = require("truffle-resolver");
const Web3 = require("web3");

async function deploySubscriptionManager() {
  const mnemonic = "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid";
  const ganacheHost = process.env.GANACHE_HOST || "localhost";
  const provider = new HDWalletProvider(mnemonic, `http://${ganacheHost}:7545`, 0, 10);
  const web3 = new Web3(provider);

  const config = {
    working_directory: path.resolve("."),
    contracts_build_directory: path.resolve("..", "ethereum", "build", "contracts"),
    compilers: {
      solc: {
        version: '0.4.25',       // Fetch exact version from solc-bin (default: truffle's version)
        settings: {          // See the solidity docs for advice about optimization and evmVersion
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    },
    provider
  };

  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  config.network_id = networkId;

  const resolver = new Resolver(config);

  const subscriptionManager = resolver.require('FakeSubscriptionChecker');
  subscriptionManager.defaults({from: accounts[0]});

  const instance = await subscriptionManager.new();

  provider.engine.stop(); // otherwise the code doesn't terminate;

  return instance;
}

module.exports = { deploySubscriptionManager };

if (!module.parent) {
  (async function () {
    try {
      const instance = await deploySubscriptionManager();
      console.log(JSON.stringify({
        Address: instance.address
      }, null, 2));

    } catch (e) {
      console.log("caught error", e);
    }

  })();
}


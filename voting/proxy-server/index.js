/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const ProxyServer = require('./src/server');

const config = {
  port: process.env.PORT || 5678,
  ethereum: {
    providerUrl:
      process.env.ETHEREUM_PROVIDER_URL ||
      'https://ropsten.infura.io/v3/4433cef5751c495291c38a2c8a082141'
  },
  orbs: {
    virtualChainId: 1000001,
    nodeAddress: '18.197.127.2'
  }
};

new ProxyServer(config).start();

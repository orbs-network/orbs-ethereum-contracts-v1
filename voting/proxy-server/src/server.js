/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const cors = require('cors');
const express = require('express');

const { OrbsClientService } = require('./services/orbs-client');
const { EthereumClientService } = require('./services/ethereum-client');

const corsOptions = {
  origin: ['http://localhost:3000', 'https://orbs-network.github.io']
};

class ProxyServer {
  constructor({ port, ethereum, orbs }) {
    this.ethereumService = new EthereumClientService(ethereum.providerUrl);
    this.orbsService = new OrbsClientService(
      orbs.nodeAddress,
      orbs.virtualChainId
    );
    this.expressApp = express();
    this.port = port;
  }
  start() {
    this.expressApp.use(cors(corsOptions));

    this.expressApp.get('/is_alive', (req, res) => res.sendStatus(200));

    this.server = this.expressApp.listen(this.port, () =>
      console.log(`Started on port ${this.port}!`)
    );
  }
  stop() {
    this.server.close();
  }
}

module.exports = ProxyServer;

/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const cors = require('cors');
const express = require('express');
const stakeApiFactory = require('./api/stake');
const rewardsApiFactory = require('./api/rewards');
const guardiansApiFactory = require('./api/guardians');
const validatorsApiFactory = require('./api/validators');
const electedValidatorsApiFactory = require('./api/elected-validators');
const { OrbsClientService } = require('./services/orbs-client');
const { EthereumClientService } = require('./services/ethereum-client');

const port = process.env.PORT || 5678;
const virtualChainId = 1000001;
const orbsNodeAddress = '18.197.127.2';
const ethereumProviderUrl =
  process.env.ETHEREUM_PROVIDER_URL ||
  'https://ropsten.infura.io/v3/4433cef5751c495291c38a2c8a082141';

const app = express();

const ethereumClient = new EthereumClientService(ethereumProviderUrl);

const orbsClientService = new OrbsClientService(
  orbsNodeAddress,
  virtualChainId
);

const corsOptions = {
  origin: ['http://localhost:3000', 'https://orbs-network.github.io']
};

app.use(cors(corsOptions));

app.get('/is_alive', (req, res) => res.sendStatus(200));
app.use('/api', guardiansApiFactory(ethereumClient, orbsClientService));
app.use('/api', electedValidatorsApiFactory(ethereumClient, orbsClientService));
app.use('/api', validatorsApiFactory(ethereumClient, orbsClientService));
app.use('/api', rewardsApiFactory(orbsClientService));
app.use('/api', stakeApiFactory(orbsClientService));

app.listen(port, () => console.log(`Started on port ${port}!`));

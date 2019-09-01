/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const cors = require('cors');
const express = require('express');
const stakeRouter = require('./routers/stake-router');
const rewardsRouter = require('./routers/rewards-router');
const guardiansRouter = require('./routers/guardians-router');
const validatorsRouter = require('./routers/validators-router');
const delegationRouter = require('./routers/delegation-router');
const electionsRouter = require('./routers/elections-router');
const electedValidatorsRouter = require('./routers/elected-validators-router');
const { orbsPOSDataServiceFactory } = require('orbs-pos-data');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const port = process.env.PORT || 5678;
const app = express();

const corsOptions = {
  origin: ['http://localhost:3000', 'https://orbs-network.github.io']
};

app.use(cors(corsOptions));

const virtualChainId = 1100000;
const orbsNodeAddress = '18.197.127.2';
const ethereumProviderUrl =
  process.env.ETHEREUM_PROVIDER_URL ||
  'https://ropsten.infura.io/v3/4433cef5751c495291c38a2c8a082141';

  console.log(ethereumProviderUrl);
  
const orbsPOSDataService = orbsPOSDataServiceFactory(
  ethereumProviderUrl,
  orbsNodeAddress,
  virtualChainId
);
app.get('/is_alive', (_, res) => res.sendStatus(200));
app.use('/api', guardiansRouter(orbsPOSDataService));
app.use('/api', electedValidatorsRouter(orbsPOSDataService));
app.use('/api', validatorsRouter(orbsPOSDataService));
app.use('/api', rewardsRouter(orbsPOSDataService));
app.use('/api', stakeRouter(orbsPOSDataService));
app.use('/api', electionsRouter(orbsPOSDataService));
app.use('/api', delegationRouter(orbsPOSDataService));

const options = {
  swaggerDefinition: {
    info: {
      title: 'Proxy Server API',
      version: '0.0.1',
      description: 'REST API descriptions for voting proxy server'
    },
    basePath: '/api'
  },
  // List of files to be processes. You can also set globs './routes/*.js'
  apis: ['./api/*.js']
};

const specs = swaggerJsdoc(options);
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, { customSiteTitle: 'Proxy Server API docs' })
);

app.listen(port, () => console.log(`Started on port ${port}!`));

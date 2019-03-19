const Web3 = require('web3');
const cors = require('cors');
const express = require('express');
const stakeApiFactory = require('./api/stake');
const rewardsApiFactory = require('./api/rewards');
const guardiansApiFactory = require('./api/guardians');
const validatorsApiFactory = require('./api/validators');
const electedValidatorsApiFactory = require('./api/elected-validators');
const { OrbsClientService } = require('./services/orbs-client');

const port = process.env.PORT || 5678;
const virtualChainId = 1008;
const orbsNodeAddress = '18.219.51.57';

const app = express();

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    'https://ropsten.infura.io/v3/4433cef5751c495291c38a2c8a082141'
  )
);

const orbsClientService = new OrbsClientService(
  orbsNodeAddress,
  virtualChainId
);

const corsOptions = {
  origin: ['http://localhost:3000', 'https://orbs-network.github.io']
};

app.use(cors(corsOptions));

app.get('/is_alive', (req, res) => res.sendStatus(200));
app.use('/api', guardiansApiFactory(web3, orbsClientService));
app.use('/api', electedValidatorsApiFactory());
app.use('/api', validatorsApiFactory(web3));
app.use('/api', rewardsApiFactory());
app.use('/api', stakeApiFactory(orbsClientService));

app.listen(port, () => console.log(`Started on port ${port}!`));

const Web3 = require('web3');
const cors = require('cors');
const express = require('express');
const guardiansApiFactory = require('./api/guardians');
const validatorsApiFactory = require('./api/validators');
const electedValidatorsApiFactory = require('./api/elected-validators');
const Orbs = require('orbs-client-sdk');

const port = process.env.PORT || 5678;
const virtualChainId = 2020;
const orbsNodeUrl = `http://3.122.219.67/vchains/${virtualChainId}`;

const app = express();

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    'https://ropsten.infura.io/v3/4433cef5751c495291c38a2c8a082141'
  )
);

const orbsClient = new Orbs.Client(
  orbsNodeUrl,
  virtualChainId,
  Orbs.NetworkType.NETWORK_TYPE_TEST_NET
);

const orbsAccount = Orbs.createAccount();

const corsOptions = {
  origin: ['http://localhost:3000', 'https://orbs-network.github.io']
};

app.use(cors(corsOptions));

app.get('/is_alive', (req, res) => res.sendStatus(200));
app.use('/api', guardiansApiFactory(web3, orbsAccount, orbsClient));
app.use('/api', electedValidatorsApiFactory());
app.use('/api', validatorsApiFactory(web3));

app.listen(port, () => console.log(`Started on port ${port}!`));
